import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NotebookCover } from "@/components/NotebookCover";
import { PRODUCTS, SUBJECTS, NOTE_TYPES, type Subject, type NoteType } from "@/lib/products";

const searchSchema = z.object({
  subject: z.enum(["Physics", "Chemistry", "Mathematics", "Biology"]).optional(),
  type: z.enum(["Full Subject", "Chapter-wise", "PYQ Solved", "Formula Booklet"]).optional(),
});
type Search = z.infer<typeof searchSchema>;


export const Route = createFileRoute("/notes")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "All Notes — NoteVault" },
      { name: "description", content: "Browse all handwritten notes for Std 12 & MHT-CET — Physics, Chemistry, Mathematics, Biology." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { subject, type } = Route.useSearch();
  const navigate = Route.useNavigate();

  const filtered = PRODUCTS.filter(
    (p) => (!subject || p.subject === subject) && (!type || p.type === type),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-foreground bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">All notes</div>
          <h1 className="mt-3 font-display text-5xl font-medium md:text-6xl">
            The full <span className="ink-underline">library</span>.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Every handwritten note we have. Filter by subject or by what you actually need.
          </p>
        </div>
      </section>

      <section className="border-b border-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-6">
          <FilterChip
            active={!subject}
            onClick={() => navigate({ search: (s: typeof Route.types.searchSchema) => ({ ...s, subject: undefined }) })}
          >
            All subjects
          </FilterChip>
          {SUBJECTS.map((s) => (
            <FilterChip
              key={s}
              active={subject === s}
              onClick={() =>
                navigate({
                  search: (cur: typeof Route.types.searchSchema) => ({
                    ...cur,
                    subject: cur.subject === s ? undefined : (s as Subject),
                  }),
                })
              }
            >
              {s}
            </FilterChip>
          ))}
          <div className="mx-3 hidden h-5 w-px bg-foreground/30 md:block" />
          <FilterChip
            active={!type}
            onClick={() => navigate({ search: (s: typeof Route.types.searchSchema) => ({ ...s, type: undefined }) })}
          >
            Any type
          </FilterChip>
          {NOTE_TYPES.map((t) => (
            <FilterChip
              key={t}
              active={type === t}
              onClick={() =>
                navigate({
                  search: (cur: typeof Route.types.searchSchema) => ({
                    ...cur,
                    type: cur.type === t ? undefined : (t as NoteType),
                  }),
                })
              }
            >
              {t}
            </FilterChip>
          ))}

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "note" : "notes"}
        </div>
        {filtered.length === 0 ? (
          <div className="border border-dashed border-foreground p-16 text-center">
            <div className="font-display text-2xl">Nothing matches that combo.</div>
            <p className="mt-2 text-sm text-muted-foreground">Try clearing a filter above.</p>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.slug} to="/notes/$slug" params={{ slug: p.slug }} className="group block">
                <NotebookCover product={p} />
                <div className="mt-5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>{p.subject}</span>
                    <span>·</span>
                    <span>{p.type}</span>
                  </div>
                  <div className="mt-2 font-display text-xl font-semibold leading-tight group-hover:underline underline-offset-4">
                    {p.title}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{p.author}</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-medium">₹{p.price}</span>
                    {p.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">₹{p.originalPrice}</span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">★ {p.rating} · {p.reviews}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-1.5 text-sm uppercase tracking-wide transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/40 bg-background text-foreground hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}
