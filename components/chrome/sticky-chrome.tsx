"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";

/*
  Pins the masthead and the category row to the top of the viewport, so search, cart and the
  categories stay in reach down a long catalogue page. The utility strip above it is promo and
  locale copy: it scrolls away and does not come back.

  Being pinned is measured, not counted — `data-stuck` flips when the wrapper reaches the top
  edge, whatever the strip above it happens to be tall — and children hang their condensed
  sizes off it with `group-data-[stuck=true]/chrome:`. That is what keeps pinned chrome near
  100px instead of the 170px the full masthead plus mobile search row would take.

  `useSyncExternalStore` rather than state set from an effect, the same way the cart reads
  localStorage: the server snapshot is "not stuck", and a reload part-way down a page corrects
  itself on the first read after hydration instead of tripping
  `react-hooks/set-state-in-effect`.
*/
function subscribe(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  window.addEventListener("resize", onStoreChange);
  return () => {
    window.removeEventListener("scroll", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}

export function StickyChrome({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  // Pinned means the wrapper's own top edge has met the viewport's: 0 while stuck, positive
  // before. One rect read per scroll event, and React re-renders only when the answer changes.
  const stuck = useSyncExternalStore(
    subscribe,
    () => (ref.current ? ref.current.getBoundingClientRect().top <= 0 : false),
    () => false,
  );

  return (
    <div
      ref={ref}
      data-stuck={stuck ? "true" : "false"}
      className="group/chrome sticky top-0 z-40 bg-white transition-shadow duration-200 data-[stuck=true]:shadow-[0_12px_26px_-20px_rgba(43,15,32,0.65)]"
    >
      {children}
    </div>
  );
}
