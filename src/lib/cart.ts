import { useEffect, useState, useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./products";
import { findCustomProduct } from "./custom-products";
import {
  getPriceSnapshot,
  getOriginalPriceSnapshot,
  subscribeOverrides,
} from "./cover-names";


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
  const unsubOverrides = subscribeOverrides(cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    unsubOverrides();
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
      const base = PRODUCTS.find((p) => p.slug === slug) ?? findCustomProduct(slug);
      if (!base) return null;
      const price = getPriceSnapshot(slug) ?? base.price;
      const originalPrice = getOriginalPriceSnapshot(slug) ?? base.originalPrice;
      const product: Product = { ...base, price, originalPrice };
      return { product, qty };
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
