import type { Product } from "@/lib/products";

const SUBJECT_SYMBOL: Record<Product["subject"], string> = {
  Physics: "F = ma",
  Chemistry: "C₆H₁₂O₆",
  Mathematics: "∫ƒ(x)dx",
  Biology: "DNA",
};

export function NotebookCover({ product, large = false }: { product: Product; large?: boolean }) {
  const symbol = SUBJECT_SYMBOL[product.subject];
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-foreground bg-paper text-foreground shadow-[6px_6px_0_0_var(--color-foreground)] ${
        large ? "shadow-[10px_10px_0_0_var(--color-foreground)]" : ""
      }`}
    >
      {/* spine */}
      <div className="absolute inset-y-0 left-3 w-px bg-foreground/20" />
      <div className="absolute inset-y-0 left-4 w-px bg-foreground/20" />

      {/* ruled lines bottom */}
      <div className="ruled-lines absolute inset-x-6 bottom-6 top-1/2 opacity-50" />

      {/* sticker tag */}
      <div className="absolute right-4 top-4 rotate-3 border border-foreground bg-background px-2 py-0.5 text-[10px] uppercase tracking-widest">
        {product.type}
      </div>

      <div className="relative flex h-full flex-col justify-between p-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            MHT-CET · Std 12
          </div>
          <div className="mt-1 font-display text-xl font-semibold leading-tight">
            {product.subject}
          </div>
        </div>

        <div className="my-4 font-display text-5xl font-medium leading-none">
          {symbol}
        </div>

        <div className="border-t border-foreground/30 pt-3">
          <div className="hand text-2xl leading-none">{product.author.split(",")[0]}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {product.pages} pages
          </div>
        </div>
      </div>
    </div>
  );
}
