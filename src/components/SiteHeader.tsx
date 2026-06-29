import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) setIsAdmin(!!data);
    };
    check();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2 min-w-0">
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight truncate">NoteVault</span>
          <span className="hand hidden sm:inline text-lg leading-none text-muted-foreground">· handwritten</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link to="/" className="hover:underline underline-offset-4">Home</Link>
          <Link to="/notes" className="hover:underline underline-offset-4">All Notes</Link>
          <Link to="/library" className="hover:underline underline-offset-4">My Purchases</Link>
          <Link to="/orders" className="hover:underline underline-offset-4">Orders</Link>
          <a href="/#why" className="hover:underline underline-offset-4">Why handwritten</a>
          <a href="/#faq" className="hover:underline underline-offset-4">FAQ</a>
          {isAdmin && (
            <Link to="/admin" className="font-medium hover:underline underline-offset-4">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/cart"
            className="group inline-flex items-center gap-2 border border-foreground bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
          >
            Cart
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-xs text-background group-hover:bg-background group-hover:text-foreground">
              {count}
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="hidden sm:inline text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Sign out
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="inline-flex md:hidden items-center justify-center border border-foreground p-1.5"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="md:hidden border-t border-foreground bg-background px-4 py-3 flex flex-col gap-3 text-sm">
          <Link to="/" onClick={closeMenu} className="py-1">Home</Link>
          <Link to="/notes" onClick={closeMenu} className="py-1">All Notes</Link>
          <Link to="/library" onClick={closeMenu} className="py-1">My Purchases</Link>
          <Link to="/orders" onClick={closeMenu} className="py-1">Orders</Link>
          <a href="/#why" onClick={closeMenu} className="py-1">Why handwritten</a>
          <a href="/#faq" onClick={closeMenu} className="py-1">FAQ</a>
          {isAdmin && (
            <Link to="/admin" onClick={closeMenu} className="py-1 font-medium">Admin</Link>
          )}
          <button
            onClick={() => { closeMenu(); handleSignOut(); }}
            className="text-left py-1 text-muted-foreground"
          >
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
