/*
  Delivery, stated once.

  The threshold, the windows and the cutoff were previously retyped as prose in three places —
  `utility-bar.tsx`, `buy-box.tsx` and `cart-drawer.tsx` — which is how a help page ends up
  contradicting a buy box. Every surface that states a delivery fact now reads it from here.

  No `server-only`: the delivery estimate is a client island, because `/p/[slug]` is prerendered
  across 470 pages and a date computed on the server would bake in at build time.
*/

export const FREE_DELIVERY_THRESHOLD = 1200;

/** The storefront delivers from Bangkok, so "today" is Bangkok's. `lib/analytics.ts` reads this
 *  same constant for its counter days, so the zone lives in exactly one place. */
export const BANGKOK = "Asia/Bangkok";

/** Bangkok is UTC+7 the whole year — no daylight saving — so Bangkok wall time is a fixed shift.
 *  Shifting and then reading getUTC* is exact here, and avoids parsing Intl parts back into a date. */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Orders placed before this hour, Bangkok time, are picked the same day. */
export const CUTOFF_HOUR = 15;

/** Days below 25°C is the storage claim; this is the returns window. Both are label-independent
 *  handling standards of ours, not something read off a bottle. */
export const RETURNS_DAYS = 60;
export const STORAGE_MAX_C = 25;

export type DeliveryMethod = "standard" | "express";
export type DeliveryZone = "metro" | "upcountry";

/*
  Fees are a business input, not a harvested figure. They are set here so every surface quotes the
  same number, and so the client can change them in one edit. Standard is waived over the
  threshold, which is the only delivery promise the storefront made before this.
*/
export type Method = {
  id: DeliveryMethod;
  label: string;
  fee: number;
  /** Waived once the subtotal reaches the free-delivery threshold. */
  freeOverThreshold: boolean;
  blurb: string;
};

export const METHODS: Method[] = [
  {
    id: "standard",
    label: "Standard delivery",
    fee: 60,
    freeOverThreshold: true,
    blurb: "Next working day in metro Bangkok, 2–4 days upcountry.",
  },
  {
    id: "express",
    label: "Express delivery",
    fee: 150,
    freeOverThreshold: false,
    blurb: "Same day in metro Bangkok when ordered before the cutoff, 1–2 days upcountry.",
  },
];

export const METHOD_BY_ID = new Map(METHODS.map((method) => [method.id, method]));

/** Working days after dispatch, earliest to latest. Sunday is not a delivery day. */
const WINDOWS: Record<DeliveryZone, Record<DeliveryMethod, [number, number]>> = {
  metro: { standard: [1, 1], express: [0, 0] },
  upcountry: { standard: [2, 4], express: [1, 2] },
};

/** What a given subtotal pays for a method. */
export function deliveryFee(method: DeliveryMethod, subtotal: number): number {
  const entry = METHOD_BY_ID.get(method);
  if (!entry) return 0;
  if (entry.freeOverThreshold && subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return entry.fee;
}

export type Estimate = {
  /** True once today's pick-up has gone; the order dispatches the next working day. */
  cutoffPassed: boolean;
  /** Minutes left before today's cutoff, or null once it has passed. */
  minutesToCutoff: number | null;
  /** Bangkok calendar dates as yyyy-mm-dd, earliest and latest. Equal when the window is one day. */
  from: string;
  to: string;
};

function bangkokParts(now: Date) {
  const shifted = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  return {
    /** midnight of the Bangkok day, as a UTC-shifted date we can do day arithmetic on */
    day: new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function iso(day: Date): string {
  return day.toISOString().slice(0, 10);
}

/** Advances by whole days, skipping Sundays, which nothing dispatches or delivers on. */
function addWorkingDays(day: Date, count: number): Date {
  const next = new Date(day);
  let left = count;
  while (left > 0) {
    next.setUTCDate(next.getUTCDate() + 1);
    if (next.getUTCDay() !== 0) left -= 1;
  }
  // A zero-day window still cannot land on a Sunday.
  while (next.getUTCDay() === 0) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * When an order placed at `now` arrives — a computation off a stated cutoff, not a promise.
 * Quote the cutoff wherever this is shown, or the date is an unsourced claim.
 */
export function estimate(
  now: Date,
  zone: DeliveryZone = "metro",
  method: DeliveryMethod = "standard",
): Estimate {
  const { day, hour, minute } = bangkokParts(now);
  const cutoffPassed = hour >= CUTOFF_HOUR;
  const dispatch = addWorkingDays(day, cutoffPassed ? 1 : 0);
  const [min, max] = WINDOWS[zone][method];

  return {
    cutoffPassed,
    minutesToCutoff: cutoffPassed ? null : (CUTOFF_HOUR - hour) * 60 - minute,
    from: iso(addWorkingDays(dispatch, min)),
    to: iso(addWorkingDays(dispatch, max)),
  };
}

const arrivalDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Tue 2 Sep — the dates from `estimate` are already Bangkok's, so they are formatted as UTC. */
export function arrivalDate(value: string): string {
  return arrivalDay.format(new Date(`${value}T00:00:00Z`));
}

/** "Tue 2 Sep" for a single day, "Tue 2 – Thu 4 Sep" for a window. */
export function arrivalRange(from: string, to: string): string {
  return from === to ? arrivalDate(from) : `${arrivalDate(from)} – ${arrivalDate(to)}`;
}

/** 4h 12m — how long is left to make today's cutoff. */
export function untilCutoff(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}
