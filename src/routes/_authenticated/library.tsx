import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { findProduct } from "@/lib/products";
import { fetchCustomProduct } from "@/lib/custom-products";
import { downloadChaptersZip } from "@/lib/download-zip";

export const Route = createFileRoute("/_authenticated/library")({
  ssr: false,
  head: () => ({ meta: [{ title: "My Purchases — NoteVault" }] }),
  component: LibraryPage,
});

type OrderItem = { slug: string; title: string; qty: number; price: number };
type ApprovedOrder = {
  id: string;
  approved_at: string | null;
  created_at: string;
  amount: number;
  items: OrderItem[];
};
type Chapter = { id: string; slug: string; chapter_number: number; title: string; pdf_url: string };

function LibraryPage() {
  const [orders, setOrders] = useState<ApprovedOrder[]>([]);
  const [chaptersBySlug, setChaptersBySlug] = useState<Record<string, Chapter[]>>({});
  const [openSlugs, setOpenSlugs] = useState<Record<string, boolean>>({});
  const [productBySlug, setProductBySlug] = useState<Record<string, { title: string; subject: string }>>({});
  const [zipping, setZipping] = useState<string | null>(null);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: orderRows } = await supabase
        .from("orders")
        .select("id,approved_at,created_at,amount,items,status")
        .eq("user_id", userData.user.id)
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      const list = (orderRows as any[] | null) ?? [];
      setOrders(list as ApprovedOrder[]);

      const slugs = Array.from(
        new Set(list.flatMap((o) => (o.items as OrderItem[]).map((i) => i.slug))),
      );
      if (slugs.length > 0) {
        const { data: chRows } = await supabase
          .from("note_chapters" as any)
          .select("id,slug,chapter_number,title,pdf_url")
          .in("slug", slugs)
          .order("chapter_number", { ascending: true });
        const grouped: Record<string, Chapter[]> = {};
        ((chRows as any[]) ?? []).forEach((c) => {
          (grouped[c.slug] ||= []).push(c as Chapter);
        });
        setChaptersBySlug(grouped);

        // Resolve product names (seed first, then custom fallback)
        const map: Record<string, { title: string; subject: string }> = {};
        await Promise.all(
          slugs.map(async (s) => {
            const p = findProduct(s);
            if (p) {
              map[s] = { title: p.title, subject: p.subject };
            } else {
              const c = await fetchCustomProduct(s);
              if (c) map[s] = { title: c.title, subject: c.subject };
            }
          }),
        );
        setProductBySlug(map);
      }
      setLoading(false);
    })();
  }, []);

  const handleDownloadAll = async (slug: string, subjectTitle: string) => {
    const chapters = chaptersBySlug[slug] ?? [];
    if (chapters.length === 0) {
      toast.error("No chapters to download");
      return;
    }
    setZipping(slug);
    setZipProgress({ done: 0, total: chapters.length });
    try {
      const result = await downloadChaptersZip(subjectTitle, chapters, (done, total) =>
        setZipProgress({ done, total }),
      );
      if (result.failed.length === 0) {
        toast.success(`Downloaded ${result.ok} chapters as ZIP`);
      } else {
        toast.warning(
          `${result.ok} downloaded · ${result.failed.length} blocked by host (links saved inside ZIP)`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ZIP failed");
    } finally {
      setZipping(null);
      setZipProgress(null);
    }
  };

  // Unique purchased subjects across all approved orders
  const purchasedSlugs = Array.from(
    new Set(orders.flatMap((o) => o.items.map((i) => i.slug))),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          My Purchases
        </h1>
        <p className="hand mt-2 text-muted-foreground">
          All your approved orders and chapter PDFs.
        </p>

        {loading && (
          <p className="mt-10 text-muted-foreground">Loading your library…</p>
        )}

        {!loading && purchasedSlugs.length === 0 && (
          <div className="mt-12 border border-foreground p-10 text-center">
            <p className="font-display text-2xl">Nothing here yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once an admin approves your payment, your notes will appear here.
            </p>
            <Link
              to="/notes"
              className="mt-6 inline-block border border-foreground px-6 py-2 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background"
            >
              Browse notes
            </Link>
          </div>
        )}

        {!loading && purchasedSlugs.length > 0 && (
          <div className="mt-10 space-y-10">
            {purchasedSlugs.map((slug) => {
              const seed = findProduct(slug);
              const resolved = productBySlug[slug];
              const title = seed?.title ?? resolved?.title ?? slug;
              const subject = seed?.subject ?? resolved?.subject ?? "";
              const chapters = chaptersBySlug[slug] ?? [];
              const isOpen = openSlugs[slug];
              const isZipping = zipping === slug;
              return (
                <div key={slug} className="border border-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground bg-foreground/5 px-6 py-4">
                    <div>
                      <div className="font-display text-xl font-semibold">{title}</div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {subject}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isZipping || chapters.length === 0}
                        onClick={() => handleDownloadAll(slug, title)}
                        className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background disabled:opacity-50"
                      >
                        <Download className="h-3 w-3" />
                        {isZipping
                          ? `Zipping ${zipProgress?.done ?? 0}/${zipProgress?.total ?? 0}`
                          : "Download all"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenSlugs((s) => ({ ...s, [slug]: !s[slug] }))}
                        className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
                      >
                        {isOpen ? "Close" : "Open"}
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                  {openSlugs[slug] && (
                    chapters.length === 0 ? (
                      <p className="p-6 text-sm text-muted-foreground">
                        No chapters uploaded yet. Check back soon.
                      </p>
                    ) : (
                      <ol className="divide-y divide-foreground/15">
                        {chapters.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-8 text-muted-foreground">
                                {String(c.chapter_number).padStart(2, "0")}
                              </span>
                              <span>{c.title}</span>
                            </div>
                            <a
                              href={c.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="border border-foreground px-3 py-1 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
                            >
                              Open PDF
                            </a>
                          </li>
                        ))}
                      </ol>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-12 flex items-center justify-between border-t border-foreground/30 pt-6">
            <p className="text-sm text-muted-foreground">
              Looking for past orders, pending payments, or receipts?
            </p>
            <Link
              to="/orders"
              className="inline-block border border-foreground px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
            >
              View order history →
            </Link>
          </div>
        )}

      </div>
      <SiteFooter />
    </div>
  );
}
