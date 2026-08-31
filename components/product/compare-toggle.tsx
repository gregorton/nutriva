"use client";

import { useSyncExternalStore } from "react";
import {
  COMPARE_LIMIT,
  compareServerSnapshot,
  compareSnapshot,
  subscribeToCompare,
  toggleCompare,
} from "@/components/product/compare-store";

/**
 * The compare checkbox on a product card.
 *
 * It sits in the facts strip rather than the image corner: the strip is the back-of-bottle spec
 * row, so the control that lines two of them up belongs beside it, and the corners are already
 * taken by the markdown flag and the save heart.
 *
 * Raised above the card's full-bleed link overlay and stops the click, exactly as QuickAdd does,
 * so ticking it never opens the product.
 */
export function CompareToggle({ slug }: { slug: string }) {
  const selected = useSyncExternalStore(subscribeToCompare, compareSnapshot, compareServerSnapshot);
  const checked = selected.includes(slug);
  const full = !checked && selected.length >= COMPARE_LIMIT;

  return (
    <label
      className={`relative z-20 flex shrink-0 items-center gap-1 ${
        full ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      }`}
      title={full ? `Comparing ${COMPARE_LIMIT} already` : "Compare this against another"}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={full}
        onChange={(event) => {
          event.stopPropagation();
          toggleCompare(slug);
        }}
        className="h-3.5 w-3.5 accent-cart-bottom"
      />
      <span className={checked ? "font-medium text-plum-700" : ""}>Compare</span>
    </label>
  );
}
