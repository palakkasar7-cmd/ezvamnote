import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotebookCover } from "@/components/NotebookCover";
import {
  refreshCoverNames,
  saveCoverName,
  getCoverNameSnapshot,
} from "@/lib/cover-names";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roles) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

type FileRow = {
  slug: string;
  file_name: string;
  size_bytes: number;
  updated_at: string;
};

function AdminPage() {
  const [files, setFiles] = useState<Record<string, FileRow>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = async () => {
    const [{ data: fileData }] = await Promise.all([
      supabase.from("note_files").select("*"),
      refreshCoverNames(),
    ]);
    const map: Record<string, FileRow> = {};
    (fileData ?? []).forEach((r: any) => (map[r.slug] = r));
    setFiles(map);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (slug: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }
    setUploading(slug);
    try {
      const path = `${slug}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("notes")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;

      const { data: userData } = await supabase.auth.getUser();
      const { error: dbErr } = await supabase.from("note_files").upsert({
        slug,
        storage_path: path,
        file_name: file.name,
        size_bytes: file.size,
        uploaded_by: userData.user!.id,
        updated_at: new Date().toISOString(),
      });
      if (dbErr) throw dbErr;

      toast.success(`Uploaded ${file.name}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handlePreview = async (slug: string) => {
    const { data, error } = await supabase.storage
      .from("notes")
      .createSignedUrl(`${slug}.pdf`, 60);
    if (error || !data) {
      toast.error("Could not generate preview link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Admin · Manage Notes
      </h1>
      <p className="hand mt-2 text-muted-foreground">
        Upload PDFs and edit the name shown on each notebook cover.
      </p>

      <div className="mt-10 border border-foreground">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground bg-foreground/5">
            <tr className="text-left">
              <th className="p-3">Product</th>
              <th className="p-3">Cover name</th>
              <th className="p-3">Current file</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const existing = files[p.slug];
              const override = getCoverNameSnapshot(p.slug);
              return (
                <tr key={p.slug} className="border-b border-foreground/20">
                  <td className="p-3 align-top">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="font-medium">
                      {override ?? p.author}
                    </div>
                    {override && (
                      <div className="text-xs text-muted-foreground">
                        default: {p.author}
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    {existing ? (
                      <div>
                        <div>{existing.file_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(existing.size_bytes / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <button
                          onClick={() => handlePreview(p.slug)}
                          className="mt-1 text-xs underline underline-offset-2"
                        >
                          Preview PDF
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">— not uploaded —</span>
                    )}
                  </td>
                  <td className="p-3 align-top text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="outline"
                        className="rounded-none"
                        onClick={() => setEditing(p)}
                      >
                        Edit name
                      </Button>
                      <label className="inline-block">
                        <Input
                          type="file"
                          accept="application/pdf"
                          disabled={uploading === p.slug}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(p.slug, f);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        <Button
                          asChild
                          disabled={uploading === p.slug}
                          variant="outline"
                          className="rounded-none"
                        >
                          <span>
                            {uploading === p.slug
                              ? "Uploading..."
                              : existing
                                ? "Replace PDF"
                                : "Upload PDF"}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditNameModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditNameModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = getCoverNameSnapshot(product.slug) ?? product.author;
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCoverName(product.slug, name);
      toast.success("Cover name updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await saveCoverName(product.slug, "");
      toast.success("Reset to default");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="grid w-full max-w-4xl gap-8 border border-foreground bg-background p-8 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Live preview
          </div>
          <div className="mt-4">
            <NotebookCover product={product} nameOverride={name} large />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Edit cover name
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {product.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only the part before the first comma shows on the cover. Default:{" "}
            <span className="text-foreground">{product.author}</span>
          </p>

          <label className="mt-6 text-sm font-medium">Cover name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 rounded-none"
            placeholder={product.author}
            autoFocus
          />

          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Button
              onClick={handleSave}
              disabled={saving || name.trim().length === 0}
              className="rounded-none"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
              className="rounded-none"
            >
              Reset to default
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="rounded-none"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
