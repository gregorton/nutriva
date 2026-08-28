export const FREE_DELIVERY_THRESHOLD = 1200;

const baht = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ฿357.00 — currency is fixed to THB while the store is Thailand-only.
 *
 *  Two decimals always, and always `.00`: every price reaching this function has been through
 *  `adjust` in `lib/fx.ts` and is a whole baht. The satang are a display convention — a money
 *  column reads as money — not a sign that anything is priced below the baht. */
export function price(value: number): string {
  return `฿${baht.format(value)}`;
}

/** ฿3.08 — per-serving cost, the figure shoppers compare across pack sizes. */
export function perServing(value: number): string {
  return `฿${value.toFixed(2)}`;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 24.9K — review counts and units sold. */
export function count(value: number): string {
  return compact.format(value);
}

export function reviewCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const reviewDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** 14 Aug 2026 — when a review was written. Absolute, not "3 days ago": a relative label read
 *  off a prerendered page goes stale the moment the page is cached. */
export function reviewDate(iso: string): string {
  return reviewDay.format(new Date(iso));
}
