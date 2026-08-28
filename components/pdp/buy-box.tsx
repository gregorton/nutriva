"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import type { Product } from "@/lib/catalog";
import { FREE_DELIVERY_THRESHOLD, price } from "@/lib/format";
import { Hint } from "@/components/ui/hint";
import { CheckIcon, MinusIcon, PlusIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";

/*
  Buy box, rebuilt on the reference site's purchase-option tile: a bordered 320px card that
  states the purchase mode, then price, then the free-delivery threshold, then a stepper
  above a full-width primary button.

  Two departures from the reference, both deliberate:
  - Everything the reference sets in green — in stock, savings, the delivery guarantee — is
    plum here. Only the add-to-cart keeps the category's gradient orange (`btn-cart`).
  - Its subscription add-on, buy-now-pay-later tiles and "see price in cart" states have no
    equivalent behind this storefront, so they are left out rather than mocked up.
*/

/** Per-order cap. Matches the stepper's max so the input and the buttons cannot disagree. */
const MAX_QTY = 12;

export function BuyBox({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const total = product.price * qty;
  const qualifies = total >= FREE_DELIVERY_THRESHOLD;
  const saving = product.listPrice ? product.listPrice - product.price : 0;

  return (
    <section className="rounded-[8px] border border-line-strong bg-white p-4" aria-label="Purchase options">
      <p className="text-[15px] font-semibold leading-snug text-ink">One-time purchase</p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={`text-[27px] font-semibold leading-none ${product.discount ? "text-sale-600" : "text-ink"}`}
          data-num
        >
          {price(product.price)}
        </span>
        {product.discount && (
          <span className="facts font-medium text-sale-600" data-num>
            ({product.discount}% off)
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {product.listPrice && (
          <span className="facts line-through" data-num>
            {price(product.listPrice)}
          </span>
        )}
      </div>

      {saving > 0 && (
        <p className="facts mt-1.5 font-medium text-plum-700" data-num>
          You save {price(saving)}
        </p>
      )}

      <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[13px] font-semibold leading-snug text-ink">
        <span>
          {qualifies ? (
            <span className="text-plum-700">This order ships free</span>
          ) : (
            <>
              FREE shipping over <span data-num>{price(FREE_DELIVERY_THRESHOLD)}</span>
            </>
          )}
        </span>
        <Hint label="Learn more about free delivery">
          Free delivery applies to the standard service once the order reaches{" "}
          <span data-num>{price(FREE_DELIVERY_THRESHOLD)}</span>. Next day in metro Bangkok, 2–4 days
          upcountry.
        </Hint>
      </p>

      <div className="mt-3">
        <p className="facts">
          Limit <span data-num>{MAX_QTY}</span> per order{" "}
          <Hint label="Why quantities are limited" className="ml-0.5">
            Stock is allocated per batch, which caps what a single order can take.
          </Hint>
        </p>

        <div className="mt-2 flex items-stretch gap-2">
          <div className="flex items-center rounded-[7px] border border-line-strong">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty === 1}
              className="flex h-12 w-10 items-center justify-center text-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-9 text-center font-medium" data-num aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              disabled={qty === MAX_QTY}
              className="flex h-12 w-10 items-center justify-center text-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
              aria-label="Increase quantity"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <p className="facts flex-1 self-center text-right">
            <span className="block text-muted">Order total</span>
            <span className="text-[15px] font-semibold text-ink" data-num>
              {price(total)}
            </span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => add(product.slug, qty)}
        className="btn-cart mt-3 h-12 w-full text-[16px]"
      >
        Add to cart
      </button>

      <p className="facts mt-2.5 flex items-center gap-1.5 font-medium text-plum-700">
        <CheckIcon className="h-3.5 w-3.5" />
        In stock, packed in Bangkok
      </p>

      <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
        <li className="flex gap-2.5">
          <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-plum-700" />
          <p className="text-[13px] leading-snug">
            {qualifies ? (
              <span className="text-plum-700">This order qualifies for free delivery.</span>
            ) : (
              <>
                Add <span data-num>{price(FREE_DELIVERY_THRESHOLD - total)}</span> for free delivery.
              </>
            )}
            <span className="block text-muted">Next-day in metro Bangkok, 2–4 days upcountry.</span>
          </p>
        </li>
        <li className="flex gap-2.5">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-plum-700" />
          <p className="text-[13px] leading-snug">
            60-day returns, opened bottles included.
            <span className="block text-muted">Packed and dispatched from our Bangkok warehouse.</span>
          </p>
        </li>
      </ul>
    </section>
  );
}
