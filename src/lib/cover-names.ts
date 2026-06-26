import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

type OverrideMap = Record<string, string>;

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
      .select("slug, cover_name");
    const map: OverrideMap = {};
    (data ?? []).forEach((r: any) => {
      if (r.cover_name) map[r.slug] = r.cover_name;
    });
    overrides = map;
    loaded = true;
    emit();
  })();
  return loading;
}

export function subscribeCoverNames(cb: () => void) {
  listeners.add(cb);
  load();
  return () => listeners.delete(cb);
}

export function getCoverNameSnapshot(slug: string): string | undefined {
  return overrides[slug];
}

export function getAllOverridesSnapshot(): OverrideMap {
  return overrides;
}

export function setCoverNameLocal(slug: string, name: string | null) {
  if (name && name.trim().length > 0) overrides[slug] = name.trim();
  else delete overrides[slug];
  emit();
}

export function useCoverName(slug: string): string | undefined {
  return useSyncExternalStore(
    subscribeCoverNames,
    () => getCoverNameSnapshot(slug),
    () => undefined,
  );
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
  setCoverNameLocal(slug, trimmed || null);
}
