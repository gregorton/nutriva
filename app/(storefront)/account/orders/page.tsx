import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { price, reviewDate } from "@/lib/format";
import { ordersForUser } from "@/lib/orders";
import { AccountHeading, EmptyPanel, StatusPill } from "@/components/account/account-panels";
import { ArrowIcon, TruckIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await ordersForUser(user.id);

  if (orders.length === 0) {
    return (
      <EmptyPanel
        icon={<TruckIcon className="h-6 w-6 text-plum-700" />}
        title="No orders yet"
        action={{ href: "/c/vitamins", label: "Browse vitamins" }}
      >
        Orders placed while signed in appear here. One placed as a guest is reachable only through
        its own confirmation page, so keep that link.
      </EmptyPanel>
    );
  }

  return (
    <>
      <AccountHeading
        title="Orders"
        count={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
      />

      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.orderNo}>
            <Link
              href={`/account/orders/${order.orderNo}`}
              className="group flex flex-wrap items-center gap-x-5 gap-y-4 rounded-tile border border-line bg-white p-4 transition-colors hover:border-line-strong sm:p-5"
            >
              <ul className="flex shrink-0 gap-1.5">
                {order.slugs.map((slug) => {
                  const product = getProduct(slug);
                  return (
                    <li
                      key={slug}
                      className="relative h-14 w-14 overflow-hidden rounded-[7px] bg-paper"
                    >
                      {product && (
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink" data-num>
                  {order.orderNo}
                </p>
                <p className="facts mt-1" data-num>
                  {reviewDate(order.createdAt)} · {order.itemCount}{" "}
                  {order.itemCount === 1 ? "item" : "items"}
                </p>
                <div className="mt-2">
                  <StatusPill status={order.status} />
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[19px] font-semibold text-ink" data-num>
                  {price(order.total)}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-plum-700">
                  View order
                  <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
