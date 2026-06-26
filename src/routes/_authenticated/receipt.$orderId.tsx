import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { findProduct } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/receipt/$orderId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Receipt — NoteVault" }] }),
  component: ReceiptPage,
});

type OrderItem = { slug: string; title: string; qty: number; price: number };
type Order = {
  id: string;
  user_id: string;
  amount: number;
  items: OrderItem[];
  status: string;
  approved_at: string | null;
  created_at: string;
};
type Chapter = { id: string; slug: string; chapter_number: number; title: string; pdf_url: string };
type Profile = { full_name: string | null; phone: string | null; email: string | null };

function ReceiptPage() {
  const { orderId } = useParams({ from: "/_authenticated/receipt/$orderId" });
  const [order, setOrder] = useState<Order | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chaptersBySlug, setChaptersBySlug] = useState<Record<string, Chapter[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: orderRow } = await supabase
        .from("orders")
        .select("id,user_id,amount,items,status,approved_at,created_at")
        .eq("id", orderId)
        .maybeSingle();
      if (!orderRow) {
        setLoading(false);
        return;
      }
      const o = orderRow as any as Order;
      setOrder(o);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name,phone,email")
        .eq("id", o.user_id)
        .maybeSingle();
      setProfile((prof as any) ?? null);

      const slugs = Array.from(new Set(o.items.map((i) => i.slug)));
      if (slugs.length) {
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
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between print:hidden">
          <Link
            to="/library"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> My Purchases
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-foreground px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>

        {loading && <p className="mt-10 text-muted-foreground">Loading receipt…</p>}

        {!loading && !order && (
          <div className="mt-12 border border-foreground p-10 text-center">
            <p className="font-display text-2xl">Receipt not found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This order may not exist or doesn't belong to you.
            </p>
          </div>
        )}

        {!loading && order && (
          <div className="mt-6 border border-foreground bg-background">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-foreground px-8 py-6">
              <div>
                <div className="font-display text-3xl font-semibold tracking-tight">
                  NoteVault
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Payment Receipt
                </div>
              </div>
              <div className="text-right">
                {order.status === "approved" ? (
                  <span className="inline-flex items-center gap-1.5 border border-foreground px-2 py-1 text-xs uppercase tracking-widest">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 border border-foreground px-2 py-1 text-xs uppercase tracking-widest">
                    {order.status}
                  </span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-6 border-b border-foreground px-8 py-6 text-sm">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Billed to
                </div>
                <div className="mt-1 font-medium">
                  {profile?.full_name || "—"}
                </div>
                {profile?.phone && (
                  <div className="text-xs text-muted-foreground">{profile.phone}</div>
                )}
                {profile?.email && !profile.email.includes("@phone.notevault") && (
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Order ID
                </div>
                <div className="mt-1 font-mono text-xs">#{order.id}</div>
                <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  Date
                </div>
                <div className="text-xs">
                  {new Date(order.approved_at ?? order.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="border-b border-foreground px-8 py-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Purchased subjects
              </div>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i} className="border-b border-foreground/15 last:border-b-0">
                      <td className="py-2">
                        <div className="font-medium">{it.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Qty {it.qty}
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium">
                        ₹{it.price * it.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-4 text-right text-xs uppercase tracking-widest text-muted-foreground">
                      Total paid
                    </td>
                    <td className="pt-4 text-right font-display text-2xl font-semibold">
                      ₹{order.amount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Downloads */}
            <div className="px-8 py-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Your downloads
              </div>
              {order.status !== "approved" ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  PDF links will appear here once the admin approves your payment.
                </p>
              ) : (
                <div className="mt-4 space-y-6">
                  {order.items.map((it) => {
                    const chapters = chaptersBySlug[it.slug] ?? [];
                    const product = findProduct(it.slug);
                    return (
                      <div key={it.slug} className="border border-foreground">
                        <div className="border-b border-foreground bg-foreground/5 px-4 py-2 font-display text-base font-semibold">
                          {product?.title ?? it.title}
                        </div>
                        {chapters.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            No chapters uploaded yet.
                          </p>
                        ) : (
                          <ol className="divide-y divide-foreground/15">
                            {chapters.map((c) => (
                              <li
                                key={c.id}
                                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-7 text-muted-foreground">
                                    {String(c.chapter_number).padStart(2, "0")}
                                  </span>
                                  <span>{c.title}</span>
                                </div>
                                <a
                                  href={c.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="inline-flex items-center gap-1.5 border border-foreground px-3 py-1 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
                                >
                                  <Download className="h-3 w-3" /> Download
                                </a>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-foreground px-8 py-4 text-center text-xs text-muted-foreground">
              Thank you for your purchase — NoteVault
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
