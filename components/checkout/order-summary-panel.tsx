"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartLine } from "@/components/cart/cart-context";
import { FreeDeliveryMeter } from "@/components/cart/free-delivery-meter";
import { DeliveryEstimate } from "@/components/pdp/delivery-estimate";
import { price } from "@/lib/format";
import type { DeliveryMethod, DeliveryZone } from "@/lib/delivery";
import type { PaymentMethod } from "@/lib/payment";

/*
  The sticky summary beside the checkout questions.

  Same card as pdp/buy-box.tsx — same border, same price scale, same order of facts — so the block
  pressed here is recognisably the block pressed on the product page. Every figure is worked out
  again on the server; none of it is posted.
*/
export function OrderSummaryPanel({
  lines,
  subtotal,
  fee,
  delivery,
  zone,
  pending,
  cartError,
  payment,
}: {
  lines: CartLine[];
  subtotal: number;
  fee: number;
  delivery: DeliveryMethod;
  zone: DeliveryZone;
  pending: boolean;
  cartError?: string;
  payment?: PaymentMethod;
}) {
  const itemCount = lines.reduce((n, line) => n + line.qty, 0);

  return (
    <aside className="lg:sticky lg:top-[calc(var(--spacing-chrome)+1rem)] lg:self-start">
      <div className="rounded-[8px] border border-line-strong bg-white p-4">
        <h2 className="text-[15px] font-semibold leading-snug text-ink">
          Your order
          <span className="facts ml-1.5 font-normal" data-num>
            ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        </h2>

        <ul className="mt-3 space-y-2.5 border-t border-line pt-3">
          {lines.map(({ product, qty }) => (
            <li key={product.slug} className="flex items-center gap-2.5">
              <Link
                href={`/p/${product.slug}`}
                className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[6px] bg-paper"
              >
                <Image src={product.image} alt="" fill sizes="44px" className="object-contain p-1" />
              </Link>
              <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                <span className="facts" data-num>
                  {qty} ×{" "}
                </span>
                {product.title}
              </p>
              <span className="facts shrink-0 font-medium text-ink" data-num>
                {price(product.price * qty)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd data-num>{price(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className={fee === 0 ? "font-medium text-pandan-700" : ""} data-num>
              {fee === 0 ? "Free" : price(fee)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-2">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="text-[22px] font-semibold text-ink" data-num>
              {price(subtotal + fee)}
            </dd>
          </div>
        </dl>

        <FreeDeliveryMeter subtotal={subtotal} className="mt-3.5" />

        <p className="facts mt-3 border-t border-line pt-3">
          <DeliveryEstimate method={delivery} zone={zone} />
        </p>

        {cartError && (
          <p className="facts mt-3 rounded-[7px] bg-paper-warm px-3 py-2 text-sale-600" role="alert">
            {cartError}
          </p>
        )}

        <button type="submit" disabled={pending || !payment} className="btn-cart mt-4 h-12 w-full text-[16px]">
          {pending ? "Placing the order…" : "Place order"}
        </button>

        <p className="facts mt-2.5 leading-snug">
          {payment
            ? payment.next
            : "No payment method is available on this deployment yet, so an order cannot be placed."}
        </p>

        <p className="facts mt-3 border-t border-line pt-3">
          Prices include VAT.{" "}
          <Link href="/legal/terms" className="text-plum-700 hover:underline">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/help/returns" className="text-plum-700 hover:underline">
            Returns
          </Link>
        </p>
      </div>
    </aside>
  );
}
