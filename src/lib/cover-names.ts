import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

type OverrideRow = {
  cover_name?: string | null;
  price?: number | null;
  original_price?: number | null;
};
type OverrideMap = Record<string, OverrideRow>;

let overrides: OverrideMap = {};
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function load() {
  if (loaded || loading) return loading ?? Promise.resolve();
  loading = (async () => {
    const { data } = await supabase
      .from("product_overrides")
      .select("slug, cover_name, price, original_price");
    const map: OverrideMap = {};
    (data ?? []).forEach((r: any) => {
      map[r.slug] = {
        cover_name: r.cover_name,
        price: r.price,
        original_price: r.original_price,
      };
    });
    overrides = map;
    loaded = true;
    emit();
  })();
  return loading;
}

export function subscribeOverrides(cb: () => void) {
  listeners.add(cb);
  load();
  return () => listeners.delete(cb);
}

export function getOverrideSnapshot(slug: string): OverrideRow | undefined {
  return overrides[slug];
}

export function getCoverNameSnapshot(slug: string): string | undefined {
  return overrides[slug]?.cover_name ?? undefined;
}

export function getPriceSnapshot(slug: string): number | undefined {
  const v = overrides[slug]?.price;
  return v == null ? undefined : v;
}

export function getOriginalPriceSnapshot(slug: string): number | undefined {
  const v = overrides[slug]?.original_price;
  return v == null ? undefined : v;
}

export function setOverrideLocal(slug: string, row: OverrideRow) {
  overrides[slug] = { ...overrides[slug], ...row };
  emit();
}

export function useCoverName(slug: string): string | undefined {
  return useSyncExternalStore(
    subscribeOverrides,
    () => getCoverNameSnapshot(slug),
    () => undefined,
  );
}

export function usePrice(slug: string): { price?: number; originalPrice?: number } {
  return useSyncExternalStore(
    subscribeOverrides,
    () => {
      const o = overrides[slug];
      return JSON.stringify({ p: o?.price, op: o?.original_price });
    },
    () => JSON.stringify({}),
  ) as unknown as { price?: number; originalPrice?: number } extends never
    ? never
    : { price?: number; originalPrice?: number } & string
    ? never
    : { price?: number; originalPrice?: number } as any;
}

export async function refreshCoverNames() {
  loaded = false;
  loading = null;
  await load();
}

export async function saveCoverName(slug: string, name: string) {
  const trimmed = name.trim();
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("product_overrides").upsert({
    slug,
    cover_name: trimmed || null,
    updated_by: userData.user?.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  setOverrideLocal(slug, { cover_name: trimmed || null });
}

export async function savePrice(
  slug: string,
  price: number | null,
  originalPrice: number | null,
) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("product_overrides").upsert({
    slug,
    price,
    original_price: originalPrice,
    updated_by: userData.user?.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  setOverrideLocal(slug, { price, original_price: originalPrice });
}
