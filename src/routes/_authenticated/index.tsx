import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NotebookCover } from "@/components/NotebookCover";
import { Price } from "@/components/Price";
import { Button } from "@/components/ui/button";
import { ProductQuickView } from "@/components/ProductQuickView";
import { addToCart } from "@/lib/cart";
import { PRODUCTS, type Product } from "@/lib/products";



export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "NoteVault — Handwritten Std 12 & MHT-CET Notes" },
      { name: "description", content: "Topper-handwritten notes for Maharashtra Std 12 & MHT-CET. Delivered instantly as PDF." },
    ],
  }),
  component: HomePage,
});

const FEATURED = ["physics-complete-std12", "chemistry-complete-std12", "maths-complete-std12", "biology-complete-std12"];

function HomePage() {
  const featured = FEATURED.map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean);
  const [quickView, setQuickView] = useState<Product | null>(null);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="paper-grain relative overflow-hidden border-b border-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 border border-foreground bg-background px-3 py-1 text-xs uppercase tracking-[0.25em]">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              MHT-CET · Std 12 · Maharashtra Board
            </div>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">
              Topper&rsquo;s <span className="ink-underline">handwritten</span> notes.
              <br />
              Now in your hands.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Every chapter, every derivation, every named-reaction — written by hand by
              99-percentilers. Photographed sharp, delivered as PDF in seconds.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/notes"
                className="inline-flex items-center gap-3 border border-foreground bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-background hover:text-foreground"
              >
                Browse all notes →
              </Link>
              <div className="hand text-2xl leading-none">
                ₹149 onwards · instant PDF
              </div>
            </div>

            <div className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-foreground pt-6">
              <Stat n="12k+" label="students" />
              <Stat n="4.9★" label="avg. rating" />
              <Stat n="60s" label="delivery" />
            </div>
          </div>

          {/* notebook stack */}
          <div className="relative md:col-span-5">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -left-6 top-6 -rotate-6 opacity-90">
                <NotebookCover product={featured[1]} />
              </div>
              <div className="absolute -right-4 top-3 rotate-3 opacity-95">
                <NotebookCover product={featured[2]} />
              </div>
              <div className="relative">
                <NotebookCover product={featured[0]} large />
              </div>
              <div className="hand absolute -bottom-10 right-0 max-w-[14ch] -rotate-3 text-2xl">
                ↗ this one&rsquo;s the bestseller
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="border-b border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-medium md:text-5xl">Pick your subject.</h2>
            <Link to="/notes" className="text-sm uppercase tracking-widest underline-offset-4 hover:underline">
              See all →
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <Link
                key={p.slug}
                to="/notes/$slug"
                params={{ slug: p.slug }}
                className="group block"
              >
                <NotebookCover product={p} />
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.type}</div>
                  <div className="mt-1 font-display text-lg font-semibold">{p.subject}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <Price slug={p.slug} price={p.price} originalPrice={p.originalPrice} />
                  </div>

                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="border-b border-foreground bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-xs uppercase tracking-[0.25em] text-background/60">Why handwritten</div>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">
              Printed PDFs forget what mattered.<br />
              <span className="hand text-5xl text-background/70">handwriting doesn&rsquo;t.</span>
            </h2>
          </div>
          <div className="grid gap-10 md:col-span-7 md:grid-cols-2">
            {WHY.map((w, i) => (
              <div key={i}>
                <div className="font-display text-3xl">0{i + 1}</div>
                <div className="mt-3 font-display text-xl">{w.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-background/70">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-b border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="font-display text-4xl font-medium md:text-5xl">Students who scored, said this.</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="border border-foreground bg-paper p-8">
                <blockquote className="hand text-2xl leading-snug">&ldquo;{t.q}&rdquo;</blockquote>
                <figcaption className="mt-6 border-t border-foreground/30 pt-4 text-sm">
                  <div className="font-medium">{t.n}</div>
                  <div className="text-muted-foreground">{t.s}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-foreground">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-display text-4xl font-medium md:text-5xl">FAQ</h2>
          <div className="mt-10 divide-y divide-foreground border-y border-foreground">
            {FAQ.map((f, i) => (
              <details key={i} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <span className="font-display text-lg">{f.q}</span>
                  <span className="font-display text-2xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ruled-lines border-b border-foreground bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-medium md:text-6xl">
            Stop re-writing. Start <span className="ink-underline">revising</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Skip the 200 hours of copying from textbooks. Get the same notes the toppers actually used.
          </p>
          <Link
            to="/notes"
            className="mt-10 inline-flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-background hover:text-foreground"
          >
            Get my notes →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

const WHY = [
  { t: "Your brain remembers ink", d: "Studies (and toppers) keep proving it: handwritten material sticks 30% better than printed PDFs." },
  { t: "Built for the exam paper", d: "Diagrams are clean, black-and-white, ready to mirror on your answer sheet." },
  { t: "Already filtered", d: "Toppers wrote only what matters. No textbook fluff. No padding." },
  { t: "Margin shortcuts", d: "Memory hooks, tricks, and 'common errors' written right next to the concept." },
];

const TESTIMONIALS = [
  { q: "Got 99.3 in MHT-CET. The Maths PYQ booklet alone was worth 10x the price.", n: "Tanmay K.", s: "MHT-CET 2024 · 99.3%ile" },
  { q: "My Chemistry was a disaster. Sara's named-reactions notes literally saved me.", n: "Priya D.", s: "Std 12 · 89%" },
  { q: "Diagrams are insane. Looks like the textbook but cleaner. Physics finally clicked.", n: "Rohan A.", s: "MHT-CET 2024 · 97.8%ile" },
];

const FAQ = [
  { q: "How do I receive the notes?", a: "Instantly as a PDF after payment. You also get a permanent download link in your account." },
  { q: "Are these printable?", a: "Yes. They're high-resolution and designed black-and-white so you can print at any local shop cheaply." },
  { q: "Do these cover MHT-CET or Std 12 board?", a: "Both. The syllabus overlaps almost completely and our notes are tagged for both patterns in the margins." },
  { q: "Refund policy?", a: "If a PDF fails to download or pages are unreadable, we refund within 7 days, no questions asked." },
];
