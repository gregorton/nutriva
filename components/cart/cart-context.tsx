"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { getProduct, type Product } from "@/lib/catalog";

type Line = { slug: string; qty: number };

type CartState = {
  lines: { product: Product; qty: number }[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "nutriva.cart.v1";

/*
  The cart lives in localStorage, which is external mutable state, so it is read through
  useSyncExternalStore rather than copied into state inside an effect. That keeps the
  server render (always empty) consistent with hydration, and syncs across tabs for free.
*/
const EMPTY: Line[] = [];
let snapshot: Line[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Line[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY; // storage blocked, or contents no longer parse
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  // First subscribe happens after mount, so this is the earliest safe read.
  if (!loaded) {
    loaded = true;
    snapshot = read();
  }
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = read();
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: Line[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: the cart still works for this session
  }
  emit();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((slug: string, qty = 1) => {
    const existing = snapshot.find((l) => l.slug === slug);
    write(
      existing
        ? snapshot.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l))
        : [...snapshot, { slug, qty }],
    );
    setIsOpen(true);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    write(
      qty <= 0
        ? snapshot.filter((l) => l.slug !== slug)
        : snapshot.map((l) => (l.slug === slug ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    write(snapshot.filter((l) => l.slug !== slug));
  }, []);

  const value = useMemo<CartState>(() => {
    const lines = raw
      .map((l) => {
        const product = getProduct(l.slug);
        return product ? { product, qty: l.qty } : null;
      })
      .filter((l): l is { product: Product; qty: number } => l !== null);

    return {
      lines,
      itemCount: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((sum, l) => sum + l.product.price * l.qty, 0),
      isOpen,
      add,
      setQty,
      remove,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [raw, isOpen, add, setQty, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
