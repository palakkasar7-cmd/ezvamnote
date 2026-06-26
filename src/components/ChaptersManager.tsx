import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Product } from "@/lib/products";

export type Chapter = {
  id: string;
  slug: string;
  chapter_number: number;
  title: string;
  pdf_url: string;
};

export function ChaptersManager({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [num, setNum] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("note_chapters" as any)
      .select("*")
      .eq("slug", product.slug)
      .order("chapter_number", { ascending: true });
    setChapters((data as any) ?? []);
  };

  useEffect(() => {
    load();
  }, [product.slug]);

  const reset = () => {
    setNum("");
    setTitle("");
    setUrl("");
    setEditingId(null);
  };

  const save = async () => {
    const n = parseInt(num, 10);
    if (!Number.isFinite(n) || n < 1) return toast.error("Chapter number required");
    if (!title.trim()) return toast.error("Title required");
    try {
      new URL(url);
    } catch {
      return toast.error("Valid PDF link required");
    }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (editingId) {
        const { error } = await supabase
          .from("note_chapters" as any)
          .update({ chapter_number: n, title: title.trim(), pdf_url: url.trim() })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("note_chapters" as any).insert({
          slug: product.slug,
          chapter_number: n,
          title: title.trim(),
          pdf_url: url.trim(),
          created_by: u.user?.id,
        });
        if (error) throw error;
      }
      toast.success("Saved");
      reset();
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const edit = (c: Chapter) => {
    setEditingId(c.id);
    setNum(String(c.chapter_number));
    setTitle(c.title);
    setUrl(c.pdf_url);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this chapter?")) return;
    const { error } = await supabase.from("note_chapters" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="grid max-h-[90vh] w-full max-w-3xl gap-6 overflow-y-auto border border-foreground bg-background p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Chapters
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold">{product.title}</h2>
        </div>

        <div className="grid gap-3 border border-foreground p-4 sm:grid-cols-[80px_1fr_1fr_auto]">
          <Input
            type="number"
            placeholder="No."
            min={1}
            value={num}
            onChange={(e) => setNum(e.target.value)}
            className="rounded-none"
          />
          <Input
            placeholder="Chapter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-none"
          />
          <Input
            placeholder="https://…/chapter.pdf"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-none"
          />
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy} className="rounded-none">
              {editingId ? "Update" : "Add"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset} className="rounded-none">
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="border border-foreground">
          <table className="w-full text-sm">
            <thead className="border-b border-foreground bg-foreground/5 text-left">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3">Title</th>
                <th className="p-3">Link</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chapters.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No chapters yet
                  </td>
                </tr>
              )}
              {chapters.map((c) => (
                <tr key={c.id} className="border-b border-foreground/20 align-top">
                  <td className="p-3">{c.chapter_number}</td>
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">
                    <a
                      href={c.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-xs underline"
                    >
                      {c.pdf_url}
                    </a>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => edit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => remove(c.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
