"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";
import { CartLine } from "@/components/cart/cart-line";
import { FreeDeliveryMeter } from "@/components/cart/free-delivery-meter";
import { DeliveryEstimate } from "@/components/pdp/delivery-estimate";
import { CloseIcon } from "@/components/ui/icons";
import { price } from "@/lib/format";

/*
  The drawer is the peek, not the cart. It confirms what was added, shows how far the subtotal is
  from free delivery, and hands off to /cart or straight to /checkout — the button used to be a
  `<button type="button">` with no handler at all.
*/
export function CartDrawer() {
  const { lines, unavailable, itemCount, subtotal, isOpen, close } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const empty = lines.length === 0 && unavailable.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Cart">
      <button
        type="button"
        onClick={close}
        aria-label="Close cart"
        className="absolute inset-0 bg-plum-900/40 backdrop-blur-[2px]"
      />

      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg">
            Cart
            {itemCount > 0 && (
              <span className="facts ml-2 text-muted">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-[7px] p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Close cart"
          >
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Link
              href="/c/vitamins"
              onClick={close}
              className="rounded-[7px] bg-turmeric-500 px-5 py-2.5 text-sm font-semibold text-plum-900 transition-colors hover:bg-turmeric-600 hover:text-white"
            >
              Start with vitamins
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <CartLine key={line.product.slug} line={line} onNavigate={close} />
                ))}
              </ul>

              {unavailable.length > 0 && (
                <div className="border-t border-line pt-3">
                  <p className="kicker text-muted">No longer available</p>
                  <ul className="divide-y divide-line">
                    {unavailable.map((line) => (
                      <CartLine key={line.product.slug} line={line} available={false} onNavigate={close} />
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <footer className="border-t border-line px-5 py-4">
              <FreeDeliveryMeter subtotal={subtotal} className="mb-3" />

              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-xl font-semibold" data-num>
                  {price(subtotal)}
                </span>
              </div>
              <DeliveryEstimate className="facts mb-3 block" />

              <Link
                href="/checkout"
                onClick={close}
                className="flex h-12 w-full items-center justify-center rounded-[7px] bg-turmeric-500 text-[15px] font-semibold text-plum-900 transition-colors hover:bg-turmeric-600 hover:text-white"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={close}
                className="mt-2 flex h-10 w-full items-center justify-center rounded-[7px] border border-line-strong text-sm font-semibold text-ink transition-colors hover:border-plum-700 hover:text-plum-700"
              >
                View cart
              </Link>
              <p className="facts mt-2 text-center">Prices include VAT · delivery chosen at checkout</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
