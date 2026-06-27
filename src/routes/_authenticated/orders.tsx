import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCoverName } from "@/lib/cover-names";
import { findProduct } from "@/lib/products";


export const Route = createFileRoute("/_authenticated/orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "Order History — NoteVault" }] }),
  component: OrdersPage,
});

type OrderItem = { slug: string; title: string; qty: number; price: number };
type Order = {
  id: string;
  status: "pending" | "approved" | "rejected" | "expired";
  approved_at: string | null;
  created_at: string;
  amount: number;
  items: OrderItem[];
};

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-foreground/10 text-foreground",
  approved: "bg-foreground text-background",
  rejected: "border border-foreground text-foreground",
  expired: "border border-dashed border-foreground text-muted-foreground",
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("orders")
        .select("id,status,approved_at,created_at,amount,items")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setOrders((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

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
          Order History
        </h1>
        <p className="hand mt-2 text-muted-foreground">
          Every order you've placed — pending, approved, or otherwise.
        </p>

        {loading && (
          <p className="mt-10 text-muted-foreground">Loading orders…</p>
        )}

        {!loading && orders.length === 0 && (
          <div className="mt-12 border border-foreground p-10 text-center">
            <p className="font-display text-2xl">No orders yet</p>
            <Link
              to="/notes"
              className="mt-6 inline-block border border-foreground px-6 py-2 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background"
            >
              Browse notes
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-8 border border-foreground">
            <table className="w-full text-sm">
              <thead className="border-b border-foreground bg-foreground/5 text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
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
                        <ItemLine key={i} slug={it.slug} fallbackTitle={it.title} qty={it.qty} />
                      ))}

                    </td>
                    <td className="p-3 font-medium">₹{o.amount}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLES[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="p-3 text-xs">
                      {o.status === "approved" ? (
                        <Link
                          to="/receipt/$orderId"
                          params={{ orderId: o.id }}
                          className="underline underline-offset-4"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function ItemLine({ slug, fallbackTitle, qty }: { slug: string; fallbackTitle: string; qty: number }) {
  const coverName = useCoverName(slug);
  const product = findProduct(slug);
  const title = coverName?.trim() || product?.title || fallbackTitle;
  return <div>{qty}× {title}</div>;
}

