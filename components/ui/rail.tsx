"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { ChevronIcon } from "@/components/ui/icons";

/**
 * Horizontal scroller for product rails. Scroll-snap does the work; the arrows are a
 * convenience for pointer users and are hidden from assistive tech since the list itself
 * is already keyboard-scrollable.
 *
 * Two things the arrows have to get right, both of which they used to get wrong:
 *
 * The step lands on a snap point. `.rail` is `scroll-snap-type: x mandatory`, so scrolling
 * by a fraction of the viewport animates smoothly to a position the snap then has to
 * correct — a smooth glide followed by a jump. The step is measured off two neighbouring
 * children instead (card plus gap), so the target already is a snap point and the snap has
 * nothing left to do.
 *
 * The layer sits above the cards. A product card is one link, laid over itself at `z-10`;
 * an arrow overlapping that card without a z-index of its own is painted under it, so the
 * inner half of the button was dead and clicking it opened a product. The layer is `z-30`,
 * and the target is 44px around a 36px circle so a near miss is still a press.
 */
type Edge = "none" | "start" | "end" | "both";

export function Rail({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const track = useRef<HTMLDivElement>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    const el = track.current;
    if (!el) return () => {};
    el.addEventListener("scroll", onStoreChange, { passive: true });
    window.addEventListener("resize", onStoreChange);
    return () => {
      el.removeEventListener("scroll", onStoreChange);
      window.removeEventListener("resize", onStoreChange);
    };
  }, []);

  // Which way there is left to go, so an arrow with nothing behind it fades out rather than
  // absorbing a click over a card. A pixel of slack: fractional card widths leave scrollLeft
  // a hair short of the true maximum. `both` means the rail does not overflow at all.
  const edge = useSyncExternalStore(
    subscribe,
    (): Edge => {
      const el = track.current;
      if (!el) return "both";
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return "both";
      if (el.scrollLeft <= 1) return "start";
      return el.scrollLeft >= max - 1 ? "end" : "none";
    },
    (): Edge => "start",
  );

  const nudge = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;

    const first = el.firstElementChild as HTMLElement | null;
    const second = el.children[1] as HTMLElement | null;
    // Pitch is one card plus the gap, read off the DOM so nothing here assumes a card width.
    const pitch = first ? (second ? second.offsetLeft - first.offsetLeft : first.offsetWidth) : 0;

    if (pitch <= 0) {
      el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
      return;
    }

    // Whole cards only, so every resting position is a snap point: as many as fit, at least one.
    const perView = Math.max(1, Math.floor((el.clientWidth + 1) / pitch));
    const from = Math.round(el.scrollLeft / pitch);
    const max = el.scrollWidth - el.clientWidth;
    const left = Math.min(max, Math.max(0, (from + direction * perView) * pitch));

    el.scrollTo({ left, behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={track} className="rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {children}
      </div>

      {/* Arrows sit level with the product image and just outside the track, so they never
          cover a title or price. The layer itself takes no clicks — only the buttons do,
          and only while there is somewhere for them to scroll. */}
      <div className="pointer-events-none absolute -left-6 -right-6 top-[30%] z-30 hidden -translate-y-1/2 items-center justify-between lg:flex">
        {([-1, 1] as const).map((direction) => {
          const spent = direction === -1 ? edge === "start" || edge === "both" : edge === "end" || edge === "both";

          return (
            <button
              key={direction}
              type="button"
              tabIndex={-1}
              aria-hidden
              disabled={spent}
              onClick={() => nudge(direction)}
              className={`grid h-11 w-11 place-items-center rounded-full transition-opacity duration-150 hover:[&>span]:border-line-strong hover:[&>span]:bg-paper active:[&>span]:scale-95 ${
                spent ? "opacity-0" : "pointer-events-auto opacity-100"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-plum-800 shadow-[0_6px_18px_-10px_rgba(43,15,32,0.5)] transition-[background-color,border-color,transform] duration-150">
                <ChevronIcon className={`h-4 w-4 ${direction === -1 ? "rotate-90" : "-rotate-90"}`} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
