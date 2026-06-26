import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, clearCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import qrImage from "@/assets/payment-qr.jpeg.asset.json";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checkout")({
  ssr: false,
  head: () => ({ meta: [{ title: "Checkout — NoteVault" }] }),
  component: CheckoutPage,
});

type Order = {
  id: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expires_at: string;
  amount: number;
  note: string | null;
};

const WINDOW_MS = 5 * 60 * 1000;

function CheckoutPage() {
  const { items, subtotal, hydrated } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);
  const [remaining, setRemaining] = useState(WINDOW_MS);
  const createdRef = useRef(false);

  // Create order once cart is ready
  useEffect(() => {
    if (!hydrated || createdRef.current) return;
    if (items.length === 0) return;
    createdRef.current = true;
    (async () => {
      setCreating(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Not signed in");
        const expiresAt = new Date(Date.now() + WINDOW_MS).toISOString();
        const payloadItems = items.map((i) => ({
          slug: i.product.slug,
          title: i.product.title,
          qty: i.qty,
          price: i.product.price,
        }));
        const { data, error } = await supabase
          .from("orders")
          .insert({
            user_id: userData.user.id,
            amount: subtotal,
            items: payloadItems,
            expires_at: expiresAt,
          })
          .select("id,status,expires_at,amount,note")
          .single();
        if (error) throw error;
        setOrder(data as Order);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not start order");
      } finally {
        setCreating(false);
      }
    })();
  }, [hydrated, items, subtotal]);

  // Countdown
  useEffect(() => {
    if (!order) return;
    const end = new Date(order.expires_at).getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order]);

  // Poll status
  useEffect(() => {
    if (!order || order.status !== "pending") return;
    const t = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,status,expires_at,amount,note")
        .eq("id", order.id)
        .maybeSingle();
      if (data) setOrder(data as Order);
    }, 4000);
    return () => clearInterval(t);
  }, [order]);

  // Auto expire client-side
  useEffect(() => {
    if (!order || order.status !== "pending") return;
    if (remaining === 0) {
      supabase
        .from("orders")
        .update({ status: "expired" })
        .eq("id", order.id)
        .eq("status", "pending");
      setOrder({ ...order, status: "expired" });
    }
  }, [remaining, order]);

  // On approval, clear cart
  useEffect(() => {
    if (order?.status === "approved") {
      clearCart();
      toast.success("Payment approved! Your notes are unlocked.");
    }
  }, [order?.status]);

  if (hydrated && items.length === 0 && !order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/notes" className="mt-6 inline-block underline">Browse notes</Link>
      </div>
    );
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold">Pay with UPI</h1>

      {creating && <p className="mt-6 text-muted-foreground">Generating your payment window…</p>}

      {order && (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="border border-foreground bg-paper p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Scan & pay</div>
            <div className="mt-4 flex aspect-square w-full items-center justify-center bg-white p-4">
              <img src={qrImage.url} alt="UPI QR" className="h-full w-full object-contain" />
            </div>
            <div className="mt-4 text-center font-display text-3xl font-medium">₹{order.amount}</div>
          </div>

          <div className="flex flex-col">
            <div className="border border-foreground p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Status</div>
              <div className="mt-2 font-display text-2xl capitalize">{order.status}</div>
              {order.status === "pending" && (
                <>
                  <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Time left</div>
                  <div className="mt-1 font-display text-4xl tabular-nums">
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Scan the QR, pay ₹{order.amount}, then wait — admin will approve your order shortly.
                  </p>
                </>
              )}
              {order.status === "approved" && (
                <p className="mt-4 text-sm">Payment approved. Your purchase is complete.</p>
              )}
              {order.status === "rejected" && (
                <p className="mt-4 text-sm">
                  Order was rejected{order.note ? `: ${order.note}` : "."}.
                </p>
              )}
              {order.status === "expired" && (
                <p className="mt-4 text-sm">This payment window expired. Please start a new order.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {(order.status === "expired" || order.status === "rejected") && (
                <Button onClick={() => navigate({ to: "/cart" })} className="rounded-none">
                  Back to cart
                </Button>
              )}
              {order.status === "approved" && (
                <>
                  <Button
                    onClick={() =>
                      navigate({ to: "/receipt/$orderId", params: { orderId: order.id } })
                    }
                    className="rounded-none"
                  >
                    View receipt & download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/library" })}
                    className="rounded-none"
                  >
                    My Purchases
                  </Button>
                </>
              )}
              <div className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
