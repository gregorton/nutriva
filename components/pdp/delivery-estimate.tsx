"use client";

import { useSyncExternalStore } from "react";
import {
  CUTOFF_HOUR,
  METHOD_BY_ID,
  arrivalRange,
  estimate,
  untilCutoff,
  type DeliveryMethod,
  type DeliveryZone,
} from "@/lib/delivery";
import { clockServerSnapshot, clockSnapshot, subscribeToClock } from "@/components/ui/clock-store";

/**
 * "Order within 4h 12m for delivery Tue 2 Sep."
 *
 * A date computed off a stated cutoff, never a promise — which is why the cutoff is printed beside
 * it. Before hydration this renders the method's own wording, so a prerendered page ships a true
 * sentence rather than a date frozen at build time. See components/ui/clock-store.ts.
 */
export function DeliveryEstimate({
  method = "standard",
  zone = "metro",
  className = "",
}: {
  method?: DeliveryMethod;
  zone?: DeliveryZone;
  className?: string;
}) {
  const ms = useSyncExternalStore(subscribeToClock, clockSnapshot, clockServerSnapshot);
  const entry = METHOD_BY_ID.get(method);

  if (!ms) return <span className={className}>{entry?.blurb}</span>;

  const { cutoffPassed, minutesToCutoff, from, to } = estimate(new Date(ms), zone, method);
  const window = arrivalRange(from, to);

  return (
    <span className={className}>
      {cutoffPassed ? (
        <>
          Today&rsquo;s {CUTOFF_HOUR}:00 pick-up has gone — arrives{" "}
          <span className="font-semibold text-ink" data-num>
            {window}
          </span>
          .
        </>
      ) : (
        <>
          Order within{" "}
          <span className="font-semibold text-ink" data-num>
            {untilCutoff(minutesToCutoff ?? 0)}
          </span>{" "}
          for delivery{" "}
          <span className="font-semibold text-ink" data-num>
            {window}
          </span>
          .
        </>
      )}
    </span>
  );
}
