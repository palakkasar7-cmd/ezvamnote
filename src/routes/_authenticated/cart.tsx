import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart, setQty, removeFromCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — NoteVault" },
      { name: "description", content: "Review your notes and check out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, count, subtotal, savings, hydrated } = useCart();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-foreground bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Cart</div>
          <h1 className="mt-2 font-display text-5xl font-medium">
            Your <span className="ink-underline">notebook</span> stack
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {!hydrated ? null : items.length === 0 ? (
          <div className="border border-dashed border-foreground p-16 text-center">
            <div className="font-display text-3xl">Empty.</div>
            <p className="hand mt-2 text-2xl text-muted-foreground">go grab a notebook ↓</p>
            <Link
              to="/notes"
              className="mt-8 inline-flex items-center gap-3 border border-foreground bg-foreground px-6 py-3 text-sm uppercase tracking-widest text-background transition hover:bg-background hover:text-foreground"
            >
              Browse notes →
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="divide-y divide-foreground border-y border-foreground">
                {items.map(({ product, qty }) => (
                  <div key={product.slug} className="flex gap-6 py-6">
                    <div className="w-24 shrink-0 border border-foreground bg-paper p-3">
                      <div className="font-display text-xs">{product.subject}</div>
                      <div className="hand mt-6 text-xl leading-none">{product.author.split(",")[0]}</div>
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link
                        to="/notes/$slug"
                        params={{ slug: product.slug }}
                        className="font-display text-lg font-semibold hover:underline"
                      >
                        {product.title}
                      </Link>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {product.type} · {product.pages} pages
                      </div>
                      <div className="mt-auto flex items-center gap-4 pt-4">
                        <div className="inline-flex items-center border border-foreground">
                          <button
                            onClick={() => setQty(product.slug, qty - 1)}
                            className="px-3 py-1 hover:bg-foreground hover:text-background"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-sm">{qty}</span>
                          <button
                            onClick={() => setQty(product.slug, qty + 1)}
                            className="px-3 py-1 hover:bg-foreground hover:text-background"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.slug)}
                          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-medium">₹{product.price * qty}</div>
                      {product.originalPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          ₹{product.originalPrice * qty}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="md:col-span-4">
              <div className="border border-foreground bg-paper p-6">
                <div className="font-display text-xl font-semibold">Summary</div>
                <dl className="mt-6 space-y-3 text-sm">
                  <Row label={`Subtotal (${count} item${count === 1 ? "" : "s"})`} value={`₹${subtotal}`} />
                  {savings > 0 && <Row label="You save" value={`−₹${savings}`} />}
                  <Row label="Delivery" value="Instant PDF" />
                </dl>
                <div className="mt-6 flex items-baseline justify-between border-t border-foreground pt-4">
                  <span className="text-xs uppercase tracking-widest">Total</span>
                  <span className="font-display text-3xl font-medium">₹{subtotal}</span>
                </div>
                <button
                  disabled
                  className="mt-6 w-full cursor-not-allowed border border-foreground bg-foreground px-6 py-4 text-sm uppercase tracking-widest text-background opacity-90"
                  title="Checkout coming soon"
                >
                  Checkout →
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Secure checkout is being set up. Coming soon.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
