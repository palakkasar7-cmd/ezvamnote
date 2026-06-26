import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight">NoteVault</span>
          <span className="hand text-lg leading-none text-muted-foreground">· handwritten</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link to="/" className="hover:underline underline-offset-4">Home</Link>
          <Link to="/notes" className="hover:underline underline-offset-4">All Notes</Link>
          <a href="/#why" className="hover:underline underline-offset-4">Why handwritten</a>
          <a href="/#faq" className="hover:underline underline-offset-4">FAQ</a>
        </nav>
        <Link
          to="/cart"
          className="group inline-flex items-center gap-2 border border-foreground bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
        >
          Cart
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-xs text-background group-hover:bg-background group-hover:text-foreground">
            {count}
          </span>
        </Link>
      </div>
    </header>
  );
}
