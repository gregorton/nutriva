import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { orderForUser } from "@/lib/orders";
import { paymentMethod } from "@/lib/payment";
import { OrderDetail } from "@/components/checkout/order-detail";

export const metadata: Metadata = { title: "Order" };

/*
  `orderForUser` matches on the order number *and* the account, so a signed-in visitor cannot read
  somebody else's order by guessing a number. The guest path is the confirmation URL, which is a
  different lookup on purpose.
*/
export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  const user = await requireUser(`/account/orders/${orderNo}`);
  const order = await orderForUser(user.id, orderNo);
  if (!order) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="kicker text-muted">Order</p>
          <h2 className="mt-1 text-[22px] font-semibold text-ink" data-num>
            {order.orderNo}
          </h2>
        </div>
        <Link
          href="/account/orders"
          className="facts text-plum-700 underline underline-offset-4 hover:text-plum-600"
        >
          All orders
        </Link>
      </div>

      <OrderDetail order={order} payment={paymentMethod(order.paymentMethod)} />
    </>
  );
}
