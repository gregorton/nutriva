"use client";

import { useCart } from "@/components/cart/cart-context";
import { CartIcon } from "@/components/ui/icons";

export function CartButton() {
  const { itemCount, open } = useCart();

  return (
    <button
      type="button"
      onClick={open}
      className="relative flex items-center gap-2 rounded-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
      aria-label={itemCount ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart, empty"}
    >
      <span className="relative">
        <CartIcon className="h-[19px] w-[19px] text-plum-700" />
        {itemCount > 0 && (
          <span
            className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-turmeric-500 px-1 text-[10px] font-bold text-plum-900"
            data-num
          >
            {itemCount}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">Cart</span>
    </button>
  );
}
