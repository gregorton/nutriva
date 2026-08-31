import type { Metadata } from "next";
import { CUTOFF_HOUR, FREE_DELIVERY_THRESHOLD, METHODS, STORAGE_MAX_C } from "@/lib/delivery";
import { price } from "@/lib/format";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Delivery & tracking",
  description: "What delivery costs, when it arrives, and how orders are packed in Bangkok.",
};

export default function DeliveryPage() {
  return (
    <PolicyPage
      kicker="Help"
      crumb="Help"
      title="Delivery & tracking"
      lede="Everything ships from our own warehouse in Bangkok. Nothing is drop-shipped, so what the site says is in stock is on a shelf here."
      sections={[
        {
          heading: "What it costs",
          facts: [
            ...METHODS.map((method) => ({
              term: method.label,
              value: (
                <>
                  <span data-num>{price(method.fee)}</span>
                  {method.freeOverThreshold && (
                    <>
                      {" "}
                      — free over <span data-num>{price(FREE_DELIVERY_THRESHOLD)}</span>
                    </>
                  )}
                  <span className="mt-0.5 block text-muted">{method.blurb}</span>
                </>
              ),
            })),
          ],
        },
        {
          heading: "When it arrives",
          body: [
            <>
              Orders placed before <span data-num>{CUTOFF_HOUR}:00</span> Bangkok time are picked
              the same day. After that they go out on the next working day. Sunday is not a
              dispatch or delivery day.
            </>,
            "The date shown in the buy box and at checkout is worked out from that cutoff and the ranges above. It is an estimate from a stated schedule, not a guarantee — a courier delay is a courier delay.",
          ],
        },
        {
          heading: "How it is packed",
          body: [
            <>
              Stock is held below <span data-num>{STORAGE_MAX_C}</span>°C and shipped with the
              manufacturer&rsquo;s seal intact. Nothing is decanted, relabelled or repackaged here.
            </>,
          ],
        },
        {
          heading: "Tracking",
          body: [
            "Every order gets a number of the form SWA-26-0001 on its confirmation page. Sign in before checking out and the order also appears under your account, where you can open it again later.",
          ],
        },
      ]}
      footnote="We deliver within Thailand only."
    />
  );
}
