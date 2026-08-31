/*
  A clock as an external store.

  Anything that prints a date derived from `Date.now()` cannot render it on the server: the
  storefront prerenders 470 product pages, so a server-rendered arrival date is the date the build
  ran. Reading the clock through `useSyncExternalStore` with an empty server snapshot is the same
  contract `components/cart/cart-context.tsx` uses for localStorage — the server and the first
  client render agree, and the real value arrives after mount. Never `useState` plus an effect.

  Zero is the pre-mount value, so a consumer branches on it to render wording instead of a date.
*/

/** Long enough that a minute counter stays honest, short enough not to matter. */
const TICK_MS = 30_000;

let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  now = Date.now();
  for (const listener of listeners) listener();
}

export function subscribeToClock(listener: () => void): () => void {
  // First subscribe happens after mount, which is the earliest the real time is safe to use.
  if (now === 0) now = Date.now();
  listeners.add(listener);
  timer ??= setInterval(tick, TICK_MS);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function clockSnapshot(): number {
  return now;
}

/** Server and pre-hydration render: no clock at all. */
export function clockServerSnapshot(): number {
  return 0;
}
