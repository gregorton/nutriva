"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";

/*
  Pins the masthead and the category row to the top of the viewport, so search, cart and the
  categories stay in reach down a long catalogue page. The utility strip above it is promo and
  locale copy: it scrolls away and does not come back.

  Being pinned is observed rather than counted — `data-stuck` flips when a sentinel just above the
  wrapper leaves the viewport, whatever the strip happens to be tall — and children hang their
  condensed sizes off it with `group-data-[stuck=true]/chrome:`. That is what keeps pinned chrome
  near 100px instead of the 170px the full masthead plus mobile search row would take.

  Why a sentinel and an IntersectionObserver rather than reading the wrapper's own rect:

  1. `getSnapshot` must be a pure read of a cached value. Measuring layout inside it makes the
     answer depend on when React happens to call it, and React calls it more than once per render
     to check the snapshot is stable — under a resize, where layout is mid-flight, consecutive
     reads disagree and every re-render schedules another. That is the "Maximum update depth
     exceeded" this component used to throw while a window was being narrowed to a phone width.
  2. The wrapper is the wrong thing to measure anyway. `position: sticky` keeps an element in
     flow, so condensing the chrome shortens the document by the 66px the masthead and the mobile
     search row give up — which can pull the scroll position back up and un-pin it, which
     re-expands the chrome, and so on. The sentinel sits *above* the wrapper, so its own position
     never moves when the chrome resizes and the state depends on scroll offset alone.

  The observer is also asynchronous and off the render path, so nothing here reads layout while
  React is rendering.
*/
type StuckStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
  set: (next: boolean) => void;
};

function createStore(): StuckStore {
  let stuck = false;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => stuck,
    // Not pinned on the server, and a reload part-way down a page corrects itself on the
    // observer's first callback rather than during hydration.
    getServerSnapshot: () => false,
    set(next) {
      if (next === stuck) return;
      stuck = next;
      for (const listener of listeners) listener();
    },
  };
}

export function StickyChrome({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const store = useMemo(() => createStore(), []);
  const stuck = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) store.set(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [store]);

  return (
    <>
      {/* One pixel of nothing, pulled back out of the flow by its own negative margin, marking
          where the chrome begins. It is not the chrome, so resizing the chrome cannot move it. */}
      <div ref={sentinel} aria-hidden className="-mb-px h-px" />

      <div
        data-stuck={stuck ? "true" : "false"}
        className="group/chrome sticky top-0 z-40 bg-white transition-shadow duration-200 data-[stuck=true]:shadow-[0_12px_26px_-20px_rgba(43,15,32,0.65)]"
      >
        {children}
      </div>
    </>
  );
}
