"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { CartLine } from "@/components/cart/cart-line";
import { FreeDeliveryMeter } from "@/components/cart/free-delivery-meter";
import { DeliveryEstimate } from "@/components/pdp/delivery-estimate";
import { ProductRail } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";
import { related } from "@/lib/catalog";
import { CUTOFF_HOUR } from "@/lib/delivery";
import { price } from "@/lib/format";

/*
  The cart as a page rather than a peek.

  Client, because the cart is localStorage read through useSyncExternalStore — see
  cart-context.tsx. Calling `related()` here costs nothing extra: the cart context already imports
  `getProduct` from lib/catalog.ts, which carries no `server-only`, so the catalogue is in the
  client bundle either way.

  The summary block is deliberately the buy box's card again — same border, same price scale, same
  order of facts — so the block you press here is the block you pressed on the product page.
*/
export function CartPage() {
  const { lines, unavailable, itemCount, subtotal } = useCart();

  if (lines.length === 0 && unavailable.length === 0) {
    return (
      <div className="rounded-tile border border-line bg-paper px-6 py-20 text-center">
        <p className="font-display text-xl">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted">
          Start from a shelf, or from the kits if this is a first order.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/c/vitamins"
            className="inline-flex h-10 items-center rounded-[7px] bg-plum-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
          >
            Browse vitamins
          </Link>
          <Link
            href="/starters"
            className="inline-flex h-10 items-center rounded-[7px] border border-line-strong px-5 text-sm font-semibold text-ink transition-colors hover:border-plum-700 hover:text-plum-700"
          >
            Starter kits
          </Link>
        </div>
      </div>
    );
  }

  // Cross-sell hangs off the first line, which is the earliest thing they chose.
  const anchor = lines[0]?.product;
  const alsoWith = anchor ? related(anchor, 10) : [];

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Items in your cart">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((line) => (
              <CartLine key={line.product.slug} line={line} size="page" />
            ))}
          </ul>

          {unavailable.length > 0 && (
            <div className="mt-8">
              <h2 className="kicker text-muted">No longer available</h2>
              <p className="facts mt-1.5 max-w-[52ch]">
                These went out of stock after you added them, so they are not in the total.
              </p>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {unavailable.map((line) => (
                  <CartLine key={line.product.slug} line={line} size="page" available={false} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-[calc(var(--spacing-chrome)+1rem)] lg:self-start">
          <div className="rounded-[8px] border border-line-strong bg-white p-4">
            <h2 className="text-[15px] font-semibold leading-snug text-ink">Order summary</h2>

            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-sm text-muted">
                Subtotal
                <span className="facts ml-1.5" data-num>
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              </span>
              <span className="text-[22px] font-semibold" data-num>
                {price(subtotal)}
              </span>
            </div>

            <FreeDeliveryMeter subtotal={subtotal} className="mt-3.5" />

            <p className="facts mt-3.5 border-t border-line pt-3">
              <DeliveryEstimate />
              <span className="mt-0.5 block">
                Cutoff <span data-num>{CUTOFF_HOUR}:00</span> Bangkok time.
              </span>
            </p>

            <Link
              href="/checkout"
              aria-disabled={lines.length === 0}
              className={`mt-4 flex h-12 w-full items-center justify-center rounded-[7px] text-[16px] font-semibold transition-colors ${
                lines.length === 0
                  ? "pointer-events-none bg-paper-warm text-faint"
                  : "bg-turmeric-500 text-plum-900 hover:bg-turmeric-600 hover:text-white"
              }`}
            >
              Checkout
            </Link>

            <p className="facts mt-2.5 text-center">
              Prices include VAT · delivery chosen at checkout
            </p>

            <ul className="mt-4 space-y-1.5 border-t border-line pt-3.5">
              <li className="facts">
                <Link href="/help/delivery" className="text-plum-700 hover:underline">
                  Delivery &amp; tracking
                </Link>
              </li>
              <li className="facts">
                <Link href="/help/returns" className="text-plum-700 hover:underline">
                  60-day returns, opened bottles included
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {alsoWith.length > 0 && (
        <section className="mt-14">
          <SectionHeader kicker="Bought alongside what you have" title="Frequently added with this" />
          <div className="mt-5">
            <ProductRail products={alsoWith} />
          </div>
        </section>
      )}
    </>
  );
}
