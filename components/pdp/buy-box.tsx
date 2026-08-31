"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import type { Product } from "@/lib/catalog";
import { MAX_QTY_PER_LINE } from "@/lib/cart";
import { FREE_DELIVERY_THRESHOLD, METHODS, RETURNS_DAYS } from "@/lib/delivery";
import { price } from "@/lib/format";
import { Hint } from "@/components/ui/hint";
import { DeliveryEstimate } from "@/components/pdp/delivery-estimate";
import { EmailSignup } from "@/components/ui/email-signup";
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

  `product.inStock` splits the whole panel. It used to be ignored here, which put "In stock,
  packed in Bangkok" and a live Add to cart beside a summary line reading "Out of stock" on the
  twelve products the catalogue marks unavailable.
*/

const STANDARD = METHODS[0];

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

      {product.inStock ? (
        <InStock product={product} qty={qty} setQty={setQty} total={total} qualifies={qualifies} add={add} />
      ) : (
        <OutOfStock slug={product.slug} />
      )}
    </section>
  );
}

function InStock({
  product,
  qty,
  setQty,
  total,
  qualifies,
  add,
}: {
  product: Product;
  qty: number;
  setQty: (next: (q: number) => number) => void;
  total: number;
  qualifies: boolean;
  add: (slug: string, qty?: number) => void;
}) {
  return (
    <>
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
          <span data-num>{price(FREE_DELIVERY_THRESHOLD)}</span>. {STANDARD.blurb}
        </Hint>
      </p>

      <div className="mt-3">
        <p className="facts">
          Limit <span data-num>{MAX_QTY_PER_LINE}</span> per order{" "}
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
              onClick={() => setQty((q) => Math.min(MAX_QTY_PER_LINE, q + 1))}
              disabled={qty === MAX_QTY_PER_LINE}
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
            <DeliveryEstimate className="mt-0.5 block text-muted" />
          </p>
        </li>
        <li className="flex gap-2.5">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-plum-700" />
          <p className="text-[13px] leading-snug">
            <span data-num>{RETURNS_DAYS}</span>-day returns, opened bottles included.
            <span className="block text-muted">Packed and dispatched from our Bangkok warehouse.</span>
          </p>
        </li>
      </ul>
    </>
  );
}

/**
 * No stepper and no add — the twelve products the catalogue marks unavailable cannot be bought,
 * so nothing here pretends otherwise. The request form records the address; it does not promise
 * mail, because the site has no sender.
 */
function OutOfStock({ slug }: { slug: string }) {
  return (
    <>
      <div className="mt-3 rounded-[7px] border border-line bg-paper px-3 py-2.5">
        <p className="text-[13px] font-semibold text-ink">Out of stock</p>
        <p className="facts mt-0.5">No date for the next batch yet.</p>
      </div>

      <div className="mt-3">
        <p className="text-[13px] font-medium text-ink">Tell me when it is back</p>
        <div className="mt-2">
          <EmailSignup source="restock" slug={slug} cta="Notify me" variant="panel" />
        </div>
      </div>

      <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
        <li className="flex gap-2.5">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-plum-700" />
          <p className="text-[13px] leading-snug">
            <span data-num>{RETURNS_DAYS}</span>-day returns, opened bottles included.
            <span className="block text-muted">On everything we do have in stock.</span>
          </p>
        </li>
      </ul>
    </>
  );
}
