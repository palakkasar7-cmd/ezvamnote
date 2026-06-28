import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Subject, NoteType } from "@/lib/products";

let items: Product[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function rowToProduct(r: any): Product {
  return {
    slug: r.slug,
    title: r.title,
    subject: r.subject as Subject,
    type: r.type as NoteType,
    author: r.author ?? "",
    pages: r.pages ?? 0,
    price: r.price ?? 0,
    originalPrice: r.original_price ?? undefined,
    rating: Number(r.rating ?? 5),
    reviews: r.reviews ?? 0,
    cover: r.cover ?? "physics",
    tagline: r.tagline ?? "",
    chapters: r.chapters ?? [],
    highlights: r.highlights ?? [],
  };
}

export async function loadCustomProducts() {
  if (loaded || loading) return loading ?? Promise.resolve();
  loading = (async () => {
    const { data } = await supabase
      .from("custom_products" as any)
      .select("*")
      .order("created_at", { ascending: false });
    items = ((data as any[]) ?? []).map(rowToProduct);
    loaded = true;
    emit();
  })();
  return loading;
}

export async function refreshCustomProducts() {
  loaded = false;
  loading = null;
  await loadCustomProducts();
}

export function getCustomProductsSnapshot(): Product[] {
  return items;
}

export function findCustomProduct(slug: string): Product | undefined {
  return items.find((p) => p.slug === slug);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  loadCustomProducts();
  return () => listeners.delete(cb);
}

export function useCustomProducts(): Product[] {
  return useSyncExternalStore(subscribe, getCustomProductsSnapshot, () => items);
}

export async function fetchCustomProduct(slug: string): Promise<Product | undefined> {
  const cached = findCustomProduct(slug);
  if (cached) return cached;
  const { data } = await supabase
    .from("custom_products" as any)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return undefined;
  return rowToProduct(data);
}

export type NewCustomProductInput = {
  slug: string;
  title: string;
  subject: Subject;
  type: NoteType;
  author: string;
  pages: number;
  price: number;
  originalPrice?: number | null;
  cover: string;
  tagline: string;
  highlights: string[];
};

export async function createCustomProduct(input: NewCustomProductInput) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("custom_products" as any).insert({
    slug: input.slug,
    title: input.title,
    subject: input.subject,
    type: input.type,
    author: input.author,
    pages: input.pages,
    price: input.price,
    original_price: input.originalPrice ?? null,
    cover: input.cover,
    tagline: input.tagline,
    highlights: input.highlights,
    created_by: userData.user?.id,
  });
  if (error) throw error;
  await refreshCustomProducts();
}

export async function deleteCustomProduct(slug: string) {
  const { error } = await supabase.from("custom_products" as any).delete().eq("slug", slug);
  if (error) throw error;
  await refreshCustomProducts();
}
