"use client";

import { useCart } from "@/components/cart/cart-context";
import { price } from "@/lib/format";

/**
 * Adds every product in a kit in one press, then the drawer opens the way it does for a single
 * add. `add` reads and writes the same external snapshot each call, so a loop composes correctly
 * — no batching helper needed in the cart for this.
 *
 * The button prints the real total, because a bundle button that hides its price is a trick.
 */
export function AddKit({ slugs, total }: { slugs: string[]; total: number }) {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        for (const slug of slugs) add(slug);
      }}
      className="btn-cart h-11 w-full text-[14px]"
    >
      Add all {slugs.length} · {price(total)}
    </button>
  );
}
