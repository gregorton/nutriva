import type { Metadata } from "next";
import { RETURNS_DAYS } from "@/lib/delivery";
import { CONTACT } from "@/lib/contact";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Returns",
  description: "Sixty-day returns, opened bottles included.",
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      kicker="Help"
      crumb="Help"
      title="Returns"
      lede={
        <>
          {RETURNS_DAYS} days from delivery, opened bottles included. A supplement you cannot
          tolerate is no use to you unopened.
        </>
      }
      sections={[
        {
          heading: "The window",
          facts: [
            { term: "How long", value: <><span data-num>{RETURNS_DAYS}</span> days from delivery</> },
            { term: "Opened items", value: "Accepted" },
            { term: "Return postage", value: "Ours when the item is faulty or wrongly sent, otherwise yours" },
            { term: "Refund", value: "To the original payment method once the parcel is back with us" },
          ],
        },
        {
          heading: "What cannot come back",
          body: [
            "Anything past its best-by date on the day it reaches us, and anything damaged after delivery. Both are judged on the parcel, not on the reason given.",
          ],
        },
        {
          heading: "Starting one",
          body: [
            <>
              Email {" "}
              <a href={CONTACT.email.href} className="font-medium text-plum-700 hover:underline">
                {CONTACT.email.address}
              </a>{" "}
              with the order number from your confirmation page. There is no returns portal — a
              person reads it and answers.
            </>,
          ],
        },
      ]}
    />
  );
}
