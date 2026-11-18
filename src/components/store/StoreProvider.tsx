"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/types/product";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartSnapshot {
  items: CartLine[];
  error: string;
  hydrated: boolean;
}

interface StoreContextValue extends CartSnapshot {
  addToCart: (product: Product, quantity?: number) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const STORAGE_KEY = "timeora_cart";
const EMPTY_SNAPSHOT: CartSnapshot = { items: [], error: "", hydrated: false };
let snapshot = EMPTY_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();
const StoreContext = createContext<StoreContextValue | null>(null);

function isCartLine(line: unknown): line is CartLine {
  if (!line || typeof line !== "object") return false;
  const entry = line as { product?: { id?: unknown }; quantity?: unknown };
  return typeof entry.product?.id === "string" &&
    typeof entry.quantity === "number" &&
    Number.isInteger(entry.quantity) &&
    entry.quantity > 0;
}

function getClientSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) snapshot = { items: parsed.filter(isCartLine), error: "", hydrated: true };
        else snapshot = { ...EMPTY_SNAPSHOT, hydrated: true };
      } else {
        snapshot = { ...EMPTY_SNAPSHOT, hydrated: true };
      }
    } catch {
      snapshot = { items: [], error: "Your saved cart could not be loaded from this browser.", hydrated: true };
    }
  }
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(items: CartLine[]) {
  snapshot = { items, error: "", hydrated: true };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      snapshot = { items, error: "Cart changes may not be saved in this browser.", hydrated: true };
    }
  }
  listeners.forEach((listener) => listener());
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const value = useMemo<StoreContextValue>(() => ({
    ...current,
    addToCart(product, quantity = 1) {
      const previous = snapshot.items;
      const currentQuantity = previous.find((line) => line.product.id === product.id)?.quantity ?? 0;
      if (product.stock <= currentQuantity || currentQuantity + quantity > product.stock) return false;
      const exists = previous.some((line) => line.product.id === product.id);
      commit(exists
        ? previous.map((line) => line.product.id === product.id
          ? { product, quantity: line.quantity + quantity }
          : line)
        : [...previous, { product, quantity }]);
      return true;
    },
    setQuantity(productId, quantity) {
      commit(snapshot.items.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        const nextQuantity = Math.min(quantity, line.product.stock);
        return nextQuantity > 0 ? [{ ...line, quantity: nextQuantity }] : [];
      }));
    },
    removeFromCart(productId) {
      commit(snapshot.items.filter((line) => line.product.id !== productId));
    },
    clearCart() {
      commit([]);
    },
    itemCount: current.items.reduce((total, line) => total + line.quantity, 0),
  }), [current]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}
