import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { findProduct } from "@/lib/products";

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
      }
      setLoading(false);
    })();
  }, []);

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
              const product = findProduct(slug);
              const chapters = chaptersBySlug[slug] ?? [];
              return (
                <div key={slug} className="border border-foreground">
                  <div className="flex items-center justify-between border-b border-foreground bg-foreground/5 px-6 py-4">
                    <div>
                      <div className="font-display text-xl font-semibold">
                        {product?.title ?? slug}
                      </div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {product?.subject ?? ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSlugs((s) => ({ ...s, [slug]: !s[slug] }))
                      }
                      className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
                    >
                      {openSlugs[slug] ? "Close" : "Open"}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${openSlugs[slug] ? "rotate-180" : ""}`}
                      />
                    </button>
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
          <div className="mt-16">
            <h2 className="font-display text-2xl font-semibold">Order history</h2>
            <div className="mt-4 border border-foreground">
              <table className="w-full text-sm">
                <thead className="border-b border-foreground bg-foreground/5 text-left">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Order</th>
                    <th className="p-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-foreground/20 align-top">
                      <td className="p-3 text-xs">
                        {new Date(o.approved_at ?? o.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs">
                        {o.items.map((it, i) => (
                          <div key={i}>
                            {it.qty}× {it.title}
                          </div>
                        ))}
                      </td>
                      <td className="p-3 font-medium">₹{o.amount}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        #{o.id.slice(0, 8)}
                      </td>
                      <td className="p-3 text-xs">
                        <Link
                          to="/receipt/$orderId"
                          params={{ orderId: o.id }}
                          className="underline underline-offset-4"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
