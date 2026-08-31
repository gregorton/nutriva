import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { price, reviewDate } from "@/lib/format";
import { ordersForUser } from "@/lib/orders";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await ordersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="rounded-tile border border-line bg-paper px-6 py-14 text-center">
        <p className="text-[17px] font-medium text-ink">No orders yet</p>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-muted">
          Orders placed while signed in appear here. One placed as a guest is reachable only through
          its own confirmation page, so keep that link.
        </p>
        <Link
          href="/c/vitamins"
          className="mt-6 inline-flex rounded-card bg-plum-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          Browse vitamins
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.orderNo}>
          <Link
            href={`/account/orders/${order.orderNo}`}
            className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-white p-4 transition-colors hover:border-line-strong"
          >
            <ul className="flex shrink-0 gap-1.5">
              {order.slugs.map((slug) => {
                const product = getProduct(slug);
                return (
                  <li
                    key={slug}
                    className="relative h-12 w-12 overflow-hidden rounded-[6px] bg-paper"
                  >
                    {product && (
                      <Image src={product.image} alt="" fill sizes="48px" className="object-contain p-1" />
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink" data-num>
                {order.orderNo}
              </p>
              <p className="facts mt-0.5" data-num>
                {reviewDate(order.createdAt)} · {order.itemCount}{" "}
                {order.itemCount === 1 ? "item" : "items"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[15px] font-semibold text-ink" data-num>
                {price(order.total)}
              </p>
              <p className="facts mt-0.5 capitalize">{order.status}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
