"use client";

import { useRef } from "react";
import { ChevronIcon } from "@/components/ui/icons";

/**
 * Horizontal scroller for product rails. Scroll-snap does the work; the arrows are a
 * convenience for pointer users and are hidden from assistive tech since the list itself
 * is already keyboard-scrollable.
 */
export function Rail({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const track = useRef<HTMLDivElement>(null);

  const nudge = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={track} className="rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {children}
      </div>

      {/* Arrows sit level with the product image and just outside the track, so they never
          cover a title or price. */}
      <div className="pointer-events-none absolute -left-5 -right-5 top-[30%] hidden -translate-y-1/2 items-center justify-between lg:flex">
        {([-1, 1] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => nudge(direction)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-plum-800 shadow-[0_6px_18px_-10px_rgba(43,15,32,0.5)] transition-colors hover:border-line-strong hover:bg-paper"
          >
            <ChevronIcon className={`h-4 w-4 ${direction === -1 ? "rotate-90" : "-rotate-90"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
