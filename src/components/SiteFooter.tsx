import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-foreground bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl font-semibold">NoteVault</div>
          <p className="hand mt-2 text-2xl text-background/80">written by toppers, for you.</p>
          <p className="mt-6 max-w-sm text-sm text-background/70">
            Handwritten notes for MHT-CET &amp; Std 12 — Physics, Chemistry, Mathematics, Biology.
            Photographed in high resolution. Delivered as PDF instantly.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-background/60">Shop</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/notes" className="hover:underline">All notes</Link></li>
            <li><Link to="/notes" search={{ subject: "Physics" }} className="hover:underline">Physics</Link></li>
            <li><Link to="/notes" search={{ subject: "Chemistry" }} className="hover:underline">Chemistry</Link></li>
            <li><Link to="/notes" search={{ subject: "Mathematics" }} className="hover:underline">Mathematics</Link></li>
            <li><Link to="/notes" search={{ subject: "Biology" }} className="hover:underline">Biology</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-background/60">Help</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="/#faq" className="hover:underline">FAQ</a></li>
            <li><a href="mailto:hello@notevault.in" className="hover:underline">Contact</a></li>
            <li><a href="/#refund" className="hover:underline">Refund policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/20 px-6 py-6 text-center text-xs text-background/60">
        © {new Date().getFullYear()} NoteVault · Made for Maharashtra State Board students.
      </div>
    </footer>
  );
}
