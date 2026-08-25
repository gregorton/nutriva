"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";
import { CloseIcon, TruckIcon } from "@/components/ui/icons";
import { FREE_DELIVERY_THRESHOLD, price } from "@/lib/format";

export function CartDrawer() {
  const { lines, itemCount, subtotal, isOpen, close, setQty } = useCart();

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

  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;

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

        {lines.length === 0 ? (
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
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map(({ product, qty }) => (
                <li key={product.slug} className="flex gap-3 py-4">
                  <Link
                    href={`/p/${product.slug}`}
                    onClick={close}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[7px] bg-paper"
                  >
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="facts text-plum-700">{product.brand}</p>
                    <Link
                      href={`/p/${product.slug}`}
                      onClick={close}
                      className="line-clamp-2 text-[13.5px] font-medium hover:text-plum-700"
                    >
                      {product.title}
                    </Link>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-[7px] border border-line-strong">
                        <button
                          type="button"
                          onClick={() => setQty(product.slug, qty - 1)}
                          className="h-8 w-8 text-muted transition-colors hover:bg-paper hover:text-ink"
                          aria-label={qty === 1 ? `Remove ${product.title}` : `Decrease quantity of ${product.title}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium" data-num>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(product.slug, qty + 1)}
                          className="h-8 w-8 text-muted transition-colors hover:bg-paper hover:text-ink"
                          aria-label={`Increase quantity of ${product.title}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold" data-num>
                        {price(product.price * qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line px-5 py-4">
              {remaining > 0 ? (
                <p className="facts mb-3 flex items-center gap-2 rounded-[7px] bg-paper-warm px-3 py-2 text-plum-800">
                  <TruckIcon className="h-4 w-4 shrink-0 text-turmeric-600" />
                  <span data-num>{price(remaining)} more for free delivery</span>
                </p>
              ) : (
                <p className="facts mb-3 flex items-center gap-2 rounded-[7px] bg-pandan-100 px-3 py-2 text-pandan-700">
                  <TruckIcon className="h-4 w-4 shrink-0" />
                  <span>Free delivery applied</span>
                </p>
              )}

              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-xl font-semibold" data-num>
                  {price(subtotal)}
                </span>
              </div>

              <button
                type="button"
                className="h-12 w-full rounded-[7px] bg-turmeric-500 text-[15px] font-semibold text-plum-900 transition-colors hover:bg-turmeric-600 hover:text-white"
              >
                Checkout
              </button>
              <p className="facts mt-2 text-center">Taxes and delivery calculated at checkout</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
