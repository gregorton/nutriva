"use client";

import { useEffect, useState } from "react";

/**
 * Counts down to the next midnight in Bangkok — the deal window is real and repeatable,
 * not a timer that resets on page load. Digits are mono so they don't reflow each tick.
 */
export function Countdown({ className = "" }: { className?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      // ICT is UTC+7 year round.
      const now = new Date();
      const ictNow = new Date(now.getTime() + 7 * 3600_000);
      const endOfDay = Date.UTC(
        ictNow.getUTCFullYear(),
        ictNow.getUTCMonth(),
        ictNow.getUTCDate() + 1,
        0,
        0,
        0,
      );
      setRemaining(endOfDay - ictNow.getTime());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Render a stable placeholder until the client clock is known, so SSR and hydration match.
  const parts =
    remaining === null
      ? ["--", "--", "--"]
      : [
          Math.floor(remaining / 3_600_000),
          Math.floor((remaining % 3_600_000) / 60_000),
          Math.floor((remaining % 60_000) / 1000),
        ].map((n) => String(n).padStart(2, "0"));

  return (
    <span className={`flex items-center gap-1 ${className}`} aria-label="Time left today">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-plum-700/50">:</span>}
          <span
            className="rounded-[4px] bg-plum-900 px-1.5 py-1 text-[13px] font-semibold tabular-nums text-turmeric-200"
            data-num
          >
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}
