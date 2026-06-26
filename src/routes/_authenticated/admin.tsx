import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const load = async () => {
    const { data } = await supabase.from("note_files").select("*");
    const map: Record<string, FileRow> = {};
    (data ?? []).forEach((r: any) => (map[r.slug] = r));
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
        Admin · Upload Notes
      </h1>
      <p className="hand mt-2 text-muted-foreground">
        Upload the PDF for each product. Stored privately — only signed URLs are
        served to buyers.
      </p>

      <div className="mt-10 border border-foreground">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground bg-foreground/5">
            <tr className="text-left">
              <th className="p-3">Product</th>
              <th className="p-3">Current file</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const existing = files[p.slug];
              return (
                <tr key={p.slug} className="border-b border-foreground/20">
                  <td className="p-3 align-top">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="p-3 align-top">
                    {existing ? (
                      <div>
                        <div>{existing.file_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(existing.size_bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                          {new Date(existing.updated_at).toLocaleString()}
                        </div>
                        <button
                          onClick={() => handlePreview(p.slug)}
                          className="mt-1 text-xs underline underline-offset-2"
                        >
                          Preview
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">— not uploaded —</span>
                    )}
                  </td>
                  <td className="p-3 align-top text-right">
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
                              ? "Replace"
                              : "Upload PDF"}
                        </span>
                      </Button>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
