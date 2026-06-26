import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NotebookCover } from "@/components/NotebookCover";
import { PRODUCTS, findProduct } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { usePrice } from "@/lib/cover-names";
import { useState } from "react";


export const Route = createFileRoute("/_authenticated/notes/$slug")({
  loader: ({ params }) => {
    const product = findProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.title} — NoteVault` },
          { name: "description", content: loaderData.product.tagline },
          { property: "og:title", content: loaderData.product.title },
          { property: "og:description", content: loaderData.product.tagline },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="font-display text-3xl">Note not found.</div>
        <Link to="/notes" className="mt-4 inline-block underline">Back to all notes</Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="font-display text-2xl">Something went wrong.</div>
        <button onClick={reset} className="mt-4 underline">Try again</button>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { price, originalPrice } = usePrice(product.slug, {
    price: product.price,
    originalPrice: product.originalPrice,
  });
  const [added, setAdded] = useState(false);
  const related = PRODUCTS.filter((p) => p.subject === product.subject && p.slug !== product.slug).slice(0, 3);


  const handleAdd = () => {
    addToCart(product.slug);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="border-b border-foreground bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/notes" className="hover:underline">Notes</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.subject}</span>
        </div>
      </div>

      <section className="border-b border-foreground">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="sticky top-24">
              <NotebookCover product={product} large />
              <div className="hand mt-6 text-center text-2xl text-muted-foreground">
                {product.pages} pages · PDF · {product.subject}
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {product.subject} · {product.type}
            </div>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">
              {product.title}
            </h1>
            <p className="hand mt-3 text-3xl text-muted-foreground">{product.tagline}</p>

            <div className="mt-6 flex items-center gap-3 text-sm">
              <span>★ {product.rating}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
              <span className="text-muted-foreground">·</span>
              <span>by {product.author}</span>
            </div>

            <div className="mt-10 flex items-baseline gap-4">
              <span className="font-display text-5xl font-medium">₹{price}</span>
              {originalPrice && originalPrice > price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">₹{originalPrice}</span>
                  <span className="border border-foreground px-2 py-0.5 text-xs uppercase tracking-widest">
                    Save ₹{originalPrice - price}
                  </span>
                </>
              )}
            </div>


            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-background hover:text-foreground"
              >
                {added ? "✓ Added to cart" : "Add to cart"}
              </button>
              <Link
                to="/cart"
                className="inline-flex items-center gap-3 border border-foreground px-8 py-4 text-sm font-medium uppercase tracking-widest transition hover:bg-foreground hover:text-background"
              >
                Buy now →
              </Link>
            </div>

            <div className="mt-12 grid gap-6 border-t border-foreground pt-10 sm:grid-cols-2">
              {product.highlights.map((h: string, i: number) => (
                <div key={i} className="flex gap-3">
                  <span className="font-display text-2xl leading-none">·</span>
                  <span className="text-sm leading-relaxed">{h}</span>
                </div>
              ))}
            </div>

            <div className="mt-14">
              <h2 className="font-display text-2xl font-medium">What&rsquo;s inside</h2>
              <ol className="mt-6 grid gap-2 sm:grid-cols-2">
                {product.chapters.map((c: string, i: number) => (
                  <li key={i} className="flex gap-3 border-b border-foreground/15 py-2 text-sm">
                    <span className="w-6 text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="font-display text-3xl font-medium">More {product.subject} notes</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} to="/notes/$slug" params={{ slug: p.slug }} className="group block">
                <NotebookCover product={p} />
                <div className="mt-4">
                  <div className="font-display text-lg font-semibold group-hover:underline">{p.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground"><Price slug={p.slug} price={p.price} originalPrice={p.originalPrice} showStrike={false} /></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
