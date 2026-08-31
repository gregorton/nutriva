"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";

const MARKER = "swa.cleared.v1";

/*
  Empties the cart once an order exists.

  The action redirects rather than returning a value, so that the no-JavaScript path lands on the
  confirmation page too — which means clearing the cart has to happen here, on the one page that
  knows an order was placed. The order number is remembered so that reopening the confirmation from
  history does not wipe a cart filled since.

  The effect writes to localStorage through the cart store, not to React state, so it does not trip
  the rule against setState in an effect that the rest of this codebase holds to.
*/
export function ClearCart({ orderNo }: { orderNo: string }) {
  const { clear } = useCart();

  useEffect(() => {
    let seen: string[] = [];
    try {
      const stored = window.localStorage.getItem(MARKER);
      seen = stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      seen = []; // storage blocked, or contents no longer parse
    }
    if (seen.includes(orderNo)) return;

    clear();
    try {
      window.localStorage.setItem(MARKER, JSON.stringify([...seen.slice(-9), orderNo]));
    } catch {
      // storage full or blocked: at worst the cart clears again on a revisit
    }
  }, [orderNo, clear]);

  return null;
}
