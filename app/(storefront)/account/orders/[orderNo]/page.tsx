import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { orderForUser } from "@/lib/orders";
import { paymentMethod } from "@/lib/payment";
import { OrderDetail } from "@/components/checkout/order-detail";
import { StatusPill } from "@/components/account/account-panels";
import { ArrowIcon } from "@/components/ui/icons";

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
    <div className="bg-white">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <Link
          href="/account/orders"
          className="facts inline-flex items-center gap-1.5 text-plum-700 hover:text-plum-600 hover:underline"
        >
          <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
          All orders
        </Link>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 className="text-[22px] font-semibold text-ink sm:text-[26px]" data-num>
            {order.orderNo}
          </h2>
          <StatusPill status={order.status} />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <OrderDetail order={order} payment={paymentMethod(order.paymentMethod)} />
      </div>
    </div>
  );
}
