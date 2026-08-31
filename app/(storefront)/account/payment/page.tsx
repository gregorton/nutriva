import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { awaitingBankDetails, paymentMethods } from "@/lib/payment";
import { Panel } from "@/components/account/account-panels";

export const metadata: Metadata = { title: "Payment options" };

/*
  Read-only, and says so.

  There is nothing to save here because there is nothing behind the storefront that could hold it:
  no card processor, so no card to store, and the methods the checkout offers are configured in the
  environment rather than per account (see lib/payment.ts). What this page can honestly do is show
  which methods are live today, which is a real answer to the question somebody opened it with.
*/
export default async function PaymentOptionsPage() {
  await requireUser("/account/payment");
  const methods = paymentMethods();

  return (
    <Panel title="Payment options" meta="Nothing to save yet">
      <p className="max-w-[58ch] text-sm leading-relaxed text-ink">
        There is no stored payment on this account, and no way to add one. Nothing behind this shop
        can process a card, so there are no card fields anywhere in the checkout, and a form that
        took a number and did nothing with it would be worse than not offering one.
      </p>

      <h3 className="mt-6 text-[13px] font-semibold text-ink">
        What the checkout accepts today
      </h3>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {methods.map((method) => (
          <li key={method.id} className="py-3">
            <p className="text-[14px] font-medium text-ink">{method.label}</p>
            <p className="facts mt-0.5 leading-snug">{method.blurb}</p>
          </li>
        ))}
      </ul>

      {awaitingBankDetails() && (
        <p className="facts mt-4 max-w-[58ch] leading-relaxed">
          Bank transfer and PromptPay are switched off until the shop&apos;s account details are in
          place. They appear here and in the checkout the moment they are set, with no code change.
        </p>
      )}

      <p className="mt-6 text-sm text-muted">
        You choose how to pay on the{" "}
        <Link href="/checkout" className="font-semibold text-plum-700 hover:underline">
          checkout page
        </Link>
        , order by order.
      </p>
    </Panel>
  );
}
