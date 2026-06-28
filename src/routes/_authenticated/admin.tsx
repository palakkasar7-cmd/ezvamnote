import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, SUBJECTS, NOTE_TYPES, type Product, type Subject, type NoteType } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotebookCover } from "@/components/NotebookCover";
import { ChaptersManager } from "@/components/ChaptersManager";
import {
  refreshCoverNames,
  saveCoverName,
  savePrice,
  getCoverNameSnapshot,
  getPriceSnapshot,
  getOriginalPriceSnapshot,
} from "@/lib/cover-names";
import {
  useCustomProducts,
  loadCustomProducts,
  refreshCustomProducts,
  createCustomProduct,
  deleteCustomProduct,
} from "@/lib/custom-products";

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
  storage_path: string;
  updated_at: string;
};

function AdminPage() {
  const [files, setFiles] = useState<Record<string, FileRow>>({});
  const [savingUrl, setSavingUrl] = useState<string | null>(null);
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Product | null>(null);
  const [chaptersFor, setChaptersFor] = useState<Product | null>(null);

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

  const handleSaveUrl = async (slug: string) => {
    const url = (urlDrafts[slug] ?? "").trim();
    if (!url) {
      toast.error("Enter a PDF link");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Enter a valid URL (https://…)");
      return;
    }
    setSavingUrl(slug);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const fileName = url.split("/").pop()?.split("?")[0] || "link.pdf";
      const { error: dbErr } = await supabase.from("note_files").upsert({
        slug,
        storage_path: url,
        file_name: fileName,
        size_bytes: 0,
        uploaded_by: userData.user!.id,
        updated_at: new Date().toISOString(),
      });
      if (dbErr) throw dbErr;
      toast.success("PDF link saved");
      setUrlDrafts((d) => ({ ...d, [slug]: "" }));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingUrl(null);
    }
  };

  const handlePreview = (row: FileRow) => {
    window.open(row.storage_path, "_blank");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
        Admin · Manage Notes
      </h1>
      <p className="hand mt-2 text-muted-foreground">
        Paste a PDF link for each note and edit the name shown on the cover.
      </p>

      <div className="mt-10 border border-foreground">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground bg-foreground/5">
            <tr className="text-left">
              <th className="p-3">Product</th>
              <th className="p-3">Cover name</th>
              <th className="p-3">Price</th>
              <th className="p-3">PDF link</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const existing = files[p.slug];
              const override = getCoverNameSnapshot(p.slug);
              const priceOv = getPriceSnapshot(p.slug);
              const origOv = getOriginalPriceSnapshot(p.slug);
              const effPrice = priceOv ?? p.price;
              const effOrig = origOv ?? p.originalPrice;
              const priceChanged = priceOv != null || origOv != null;
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
                    <div className="font-medium">
                      ₹{effPrice}
                      {effOrig && effOrig > effPrice && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">₹{effOrig}</span>
                      )}
                    </div>
                    {priceChanged && (
                      <div className="text-xs text-muted-foreground">
                        default: ₹{p.price}{p.originalPrice ? ` / ₹${p.originalPrice}` : ""}
                      </div>
                    )}
                  </td>

                  <td className="p-3 align-top">
                    {existing ? (
                      <div>
                        <a
                          href={existing.storage_path}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-xs underline underline-offset-2"
                        >
                          {existing.storage_path}
                        </a>
                        <button
                          onClick={() => handlePreview(existing)}
                          className="mt-1 block text-xs underline underline-offset-2"
                        >
                          Open link
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">— no link —</span>
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
                      <Button
                        variant="outline"
                        className="rounded-none"
                        onClick={() => setChaptersFor(p)}
                      >
                        Chapters
                      </Button>
                      <div className="flex w-full max-w-xs gap-2">
                        <Input
                          type="url"
                          placeholder="https://…/notes.pdf"
                          value={urlDrafts[p.slug] ?? ""}
                          onChange={(e) =>
                            setUrlDrafts((d) => ({ ...d, [p.slug]: e.target.value }))
                          }
                          disabled={savingUrl === p.slug}
                          className="rounded-none"
                        />
                        <Button
                          onClick={() => handleSaveUrl(p.slug)}
                          disabled={savingUrl === p.slug}
                          variant="outline"
                          className="rounded-none"
                        >
                          {savingUrl === p.slug
                            ? "Saving..."
                            : existing
                              ? "Update"
                              : "Save"}
                        </Button>
                      </div>
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

      {chaptersFor && (
        <ChaptersManager
          product={chaptersFor}
          onClose={() => setChaptersFor(null)}
        />
      )}

      <OrdersPanel />
    </div>
  );
}

type OrderRow = {
  id: string;
  user_id: string;
  amount: number;
  items: Array<{ slug: string; title: string; qty: number; price: number }>;
  status: "pending" | "approved" | "rejected" | "expired";
  expires_at: string;
  created_at: string;
  note: string | null;
};

function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setOrders((data as any) ?? []);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const act = async (id: string, status: "approved" | "rejected", note?: string) => {
    setBusy(id);
    try {
      const patch: any = { status };
      if (status === "approved") patch.approved_at = new Date().toISOString();
      if (note) patch.note = note;
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
      toast.success(`Order ${status}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="font-display text-3xl font-semibold">Orders</h2>
      <p className="hand mt-1 text-muted-foreground">Approve UPI payments here.</p>
      <div className="mt-6 border border-foreground">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground bg-foreground/5 text-left">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Items</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No orders yet</td></tr>
            )}
            {orders.map((o) => {
              const expired = o.status === "pending" && new Date(o.expires_at).getTime() < Date.now();
              const effStatus = expired ? "expired" : o.status;
              return (
                <tr key={o.id} className="border-b border-foreground/20 align-top">
                  <td className="p-3 text-xs">
                    {new Date(o.created_at).toLocaleString()}
                    <div className="text-muted-foreground">#{o.id.slice(0,8)}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {o.items?.map((it, i) => (
                      <div key={i}>{it.qty}× {it.title}</div>
                    ))}
                    <div className="mt-1 text-muted-foreground">user {o.user_id.slice(0,8)}</div>
                  </td>
                  <td className="p-3 font-medium">₹{o.amount}</td>
                  <td className="p-3 capitalize">{effStatus}</td>
                  <td className="p-3 text-right">
                    {o.status === "pending" && !expired ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none"
                          disabled={busy === o.id}
                          onClick={() => act(o.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none"
                          disabled={busy === o.id}
                          onClick={() => {
                            const reason = window.prompt("Reason for rejection?") ?? "";
                            act(o.id, "rejected", reason);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
  const initialPrice = getPriceSnapshot(product.slug) ?? product.price;
  const initialOrig = getOriginalPriceSnapshot(product.slug) ?? product.originalPrice ?? 0;
  const [name, setName] = useState(initial);
  const [price, setPrice] = useState<string>(String(initialPrice));
  const [origPrice, setOrigPrice] = useState<string>(initialOrig ? String(initialOrig) : "");
  const [saving, setSaving] = useState(false);

  const parsedPrice = Number.parseInt(price, 10);
  const parsedOrig = origPrice.trim() === "" ? null : Number.parseInt(origPrice, 10);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const origValid = parsedOrig === null || (Number.isFinite(parsedOrig) && parsedOrig >= 0);

  const handleSave = async () => {
    if (!priceValid || !origValid) {
      toast.error("Enter valid prices");
      return;
    }
    setSaving(true);
    try {
      await saveCoverName(product.slug, name);
      await savePrice(product.slug, parsedPrice, parsedOrig);
      toast.success("Saved");
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
      await savePrice(product.slug, null, null);
      toast.success("Reset to defaults");
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
        className="grid max-h-[90vh] w-full max-w-4xl gap-8 overflow-y-auto border border-foreground bg-background p-8 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Live preview
          </div>
          <div className="mt-4">
            <NotebookCover product={product} nameOverride={name} large />
          </div>
          <div className="mt-6 border border-foreground p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Price preview</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-3xl font-medium">
                ₹{priceValid ? parsedPrice : "—"}
              </span>
              {parsedOrig != null && origValid && parsedOrig > parsedPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">₹{parsedOrig}</span>
                  <span className="border border-foreground px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    Save ₹{parsedOrig - parsedPrice}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Edit product
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {product.title}
          </h2>

          <label className="mt-6 text-sm font-medium">Cover name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 rounded-none"
            placeholder={product.author}
            autoFocus
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Only the part before the first comma shows on the cover. Default: {product.author}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 rounded-none"
                placeholder={String(product.price)}
              />
              <p className="mt-1 text-xs text-muted-foreground">default ₹{product.price}</p>
            </div>
            <div>
              <label className="text-sm font-medium">MRP / strike (₹)</label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={origPrice}
                onChange={(e) => setOrigPrice(e.target.value)}
                className="mt-2 rounded-none"
                placeholder={product.originalPrice ? String(product.originalPrice) : "optional"}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {product.originalPrice ? `default ₹${product.originalPrice}` : "leave blank to hide"}
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Button
              onClick={handleSave}
              disabled={saving || name.trim().length === 0 || !priceValid || !origValid}
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
              Reset to defaults
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

