import { useEffect, useState, useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./products";

const KEY = "notevault.cart.v1";
type CartMap = Record<string, number>;

function read(): CartMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartMap) : {};
  } catch {
    return {};
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function write(next: CartMap) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function addToCart(slug: string, qty = 1) {
  const cur = read();
  cur[slug] = (cur[slug] ?? 0) + qty;
  write(cur);
}
export function setQty(slug: string, qty: number) {
  const cur = read();
  if (qty <= 0) delete cur[slug];
  else cur[slug] = qty;
  write(cur);
}
export function removeFromCart(slug: string) {
  const cur = read();
  delete cur[slug];
  write(cur);
}
export function clearCart() {
  write({});
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const map = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(read()),
    () => "{}",
  );
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const parsed: CartMap = hydrated ? JSON.parse(map) : {};
  const items = Object.entries(parsed)
    .map(([slug, qty]) => {
      const product = PRODUCTS.find((p) => p.slug === slug);
      return product ? { product, qty } : null;
    })
    .filter(Boolean) as { product: Product; qty: number }[];
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const savings = items.reduce(
    (s, i) => s + ((i.product.originalPrice ?? i.product.price) - i.product.price) * i.qty,
    0,
  );
  return { items, count, subtotal, savings, hydrated };
}
