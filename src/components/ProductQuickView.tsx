import { Link } from "@tanstack/react-router";
import { NotebookCover } from "@/components/NotebookCover";
import { Price } from "@/components/Price";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { toast } from "sonner";

export function ProductQuickView({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const handleAdd = () => {
    addToCart(product.slug, 1);
    toast.success("Added to cart");
  };

  const handleBuy = () => {
    addToCart(product.slug, 1);
    onClose();
    // navigate to cart
    window.location.href = "/cart";
  };

  const full = Math.floor(product.rating);
  const half = product.rating - full >= 0.5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="grid max-h-[92vh] w-full max-w-4xl gap-8 overflow-y-auto border border-foreground bg-background p-6 md:grid-cols-2 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <NotebookCover product={product} large />
        </div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {product.subject} · {product.type}
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
                {product.title}
              </h2>
              <div className="mt-1 text-sm text-muted-foreground">{product.author}</div>
            </div>
            <button
              onClick={onClose}
              className="border border-foreground px-2 py-0.5 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background"
            >
              Close
            </button>
          </div>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex" aria-label={`Rated ${product.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < full || (i === full && half);
                return (
                  <span key={i} className={filled ? "text-foreground" : "text-foreground/25"}>
                    ★
                  </span>
                );
              })}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({product.reviews.toLocaleString()} reviews)
            </span>
          </div>

          {/* Tagline / description */}
          <p className="mt-4 text-base leading-relaxed">{product.tagline}</p>

          <div className="mt-5 border-t border-foreground/30 pt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              What you get
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="text-foreground">›</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            {product.pages} pages · instant PDF download
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <Price
              slug={product.slug}
              price={product.price}
              originalPrice={product.originalPrice}
              className="font-display text-3xl font-medium"
              strikeClassName="text-sm text-muted-foreground line-through ml-2"
            />
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <Button onClick={handleBuy} className="rounded-none">
              Buy now
            </Button>
            <Button
              variant="outline"
              onClick={handleAdd}
              className="rounded-none"
            >
              Add to cart
            </Button>
            <Link
              to="/notes/$slug"
              params={{ slug: product.slug }}
              onClick={onClose}
              className="ml-auto self-center text-sm uppercase tracking-widest underline-offset-4 hover:underline"
            >
              Full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
