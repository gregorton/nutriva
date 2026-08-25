export const FREE_DELIVERY_THRESHOLD = 1200;

const baht = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ฿553.50 — currency is fixed to THB while the store is Thailand-only. */
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
