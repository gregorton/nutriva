import Image from "next/image";
import Link from "next/link";
import { getProduct } from "@/lib/catalog";
import { METHOD_BY_ID } from "@/lib/delivery";
import { price, reviewDate } from "@/lib/format";
import type { Order } from "@/lib/orders";
import type { PaymentMethod } from "@/lib/payment";

/*
  One order, read back. Shared by the confirmation page and /account/orders/[orderNo].

  Titles, brands and prices come off the order row, never from the catalogue — see
  lib/schema/005_orders.sql. `getProduct` is consulted only for a thumbnail and a link, and both
  degrade to nothing when the slug has since been retired, which is exactly the case the
  snapshotted columns exist for.
*/
export function OrderDetail({ order, payment }: { order: Order; payment: PaymentMethod | null }) {
  const delivery = METHOD_BY_ID.get(order.deliveryMethod as never);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="Items">
        <h2 className="kicker text-muted">
          {order.items.length} {order.items.length === 1 ? "line" : "lines"}
        </h2>

        <ul className="mt-2 divide-y divide-line border-y border-line">
          {order.items.map((item) => {
            const product = getProduct(item.slug);
            return (
              <li key={item.slug} className="flex gap-3 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[7px] bg-paper">
                  {product && (
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="facts text-plum-700">{item.brand}</p>
                  {product ? (
                    <Link
                      href={`/p/${item.slug}`}
                      className="text-[13.5px] font-medium hover:text-plum-700"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-[13.5px] font-medium text-ink">{item.title}</p>
                  )}
                  <p className="facts mt-1" data-num>
                    {item.qty} × {price(item.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold" data-num>
                  {price(item.unitPrice * item.qty)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[8px] border border-line-strong bg-white p-4">
          <h2 className="text-[15px] font-semibold text-ink">Total</h2>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd data-num>{price(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className={order.deliveryFee === 0 ? "font-medium text-pandan-700" : ""} data-num>
                {order.deliveryFee === 0 ? "Free" : price(order.deliveryFee)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="text-[22px] font-semibold text-ink" data-num>
                {price(order.total)}
              </dd>
            </div>
          </dl>
          <p className="facts mt-2">Prices include VAT.</p>
        </div>

        <div className="rounded-[8px] border border-line bg-paper p-4">
          <h2 className="kicker text-muted">Delivery</h2>
          <address className="mt-2 not-italic text-[13.5px] leading-relaxed text-ink">
            {order.name}
            <br />
            {order.address.line}
            <br />
            {order.address.subdistrict}, {order.address.district}
            <br />
            {order.address.province} <span data-num>{order.address.postcode}</span>
          </address>
          <p className="facts mt-2.5" data-num>
            {order.phone} · {order.email}
          </p>
          {delivery && (
            <p className="facts mt-2.5 border-t border-line pt-2.5">
              <span className="font-medium text-ink">{delivery.label}</span>
              <span className="mt-0.5 block">{delivery.blurb}</span>
            </p>
          )}
        </div>

        <div className="rounded-[8px] border border-line bg-paper p-4">
          <h2 className="kicker text-muted">Payment</h2>
          <p className="mt-2 text-[13.5px] font-medium text-ink">{payment?.label ?? order.paymentMethod}</p>
          {payment && <p className="facts mt-1.5 leading-relaxed">{payment.next}</p>}

          {payment && payment.details.length > 0 && (
            <dl className="mt-3 space-y-1 border-t border-line pt-2.5">
              {payment.details.map((detail) => (
                <div key={detail.term} className="flex flex-wrap gap-x-3">
                  <dt className="facts w-32 font-semibold text-ink">{detail.term}</dt>
                  <dd className="facts flex-1 text-ink" data-num>
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="facts mt-3 border-t border-line pt-2.5" data-num>
            Placed {reviewDate(order.createdAt)}
          </p>
        </div>
      </aside>
    </div>
  );
}
