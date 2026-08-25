"use client";

import { useCart } from "@/components/cart/cart-context";

/**
 * Card-level add. Two placements:
 *
 * - `reveal` sits over the bottom of the product image and only appears on hover or
 *   keyboard focus, so a grid at rest is just products. Devices without hover show it
 *   permanently — a touch user has no way to summon it otherwise (see `.reveal-add`).
 * - `inline` is the always-visible variant.
 *
 * Either way the button is raised above the card's full-bleed link overlay and stops the
 * click, so adding to the cart never navigates to the product page.
 */
export function QuickAdd({ slug, variant = "inline" }: { slug: string; variant?: "inline" | "reveal" }) {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(slug);
      }}
      className={`btn-cart relative z-20 h-9 w-full text-[13px] ${
        variant === "reveal" ? "reveal-add shadow-[0_8px_18px_-10px_rgba(43,15,32,0.6)]" : ""
      }`}
    >
      Add to cart
    </button>
  );
}
