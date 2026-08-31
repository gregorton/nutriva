import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { orderByNo } from "@/lib/orders";
import { paymentMethod } from "@/lib/payment";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { OrderDetail } from "@/components/checkout/order-detail";
import { ClearCart } from "@/components/checkout/clear-cart";
import { CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

/*
  The confirmation, and for a guest the only way back to their order — which is why the order number
  comes off a sequence rather than being derivable from anything public.

  The cart is emptied here rather than in the action, because the action redirects so that the
  no-JavaScript path lands on this page too. See components/checkout/clear-cart.tsx.
*/
export default async function ConfirmationPage({ params }: PageProps<"/checkout/confirmation/[orderNo]">) {
  const { orderNo } = await params;
  const order = await orderByNo(orderNo);
  if (!order) notFound();

  return (
    <div className="shell py-6">
      <ClearCart orderNo={order.orderNo} />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Order placed" }]} />

      <header className="mt-3 border-b border-line pb-6">
        <p className="kicker flex items-center gap-1.5 text-pandan-700">
          <CheckIcon className="h-3.5 w-3.5" />
          Order placed
        </p>
        <h1 className="mt-1.5 text-[28px] sm:text-[34px]">
          Thank you, {order.name.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">
          Your order number is{" "}
          <strong className="font-semibold text-ink" data-num>
            {order.orderNo}
          </strong>
          . Keep it — it is what identifies this order in any message to us.
        </p>
        <p className="mt-2 max-w-[60ch] text-sm text-muted">
          A person picks and packs this in Bangkok; nothing is dispatched automatically. Quote the
          number above and we can tell you where it is.
        </p>
      </header>

      <div className="mt-8">
        <OrderDetail order={order} payment={paymentMethod(order.paymentMethod)} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link
          href="/account/orders"
          className="inline-flex h-10 items-center rounded-[7px] bg-plum-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          Your orders
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-[7px] border border-line-strong px-5 text-sm font-semibold text-ink transition-colors hover:border-plum-700 hover:text-plum-700"
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
