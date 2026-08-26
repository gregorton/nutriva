"use client";

import { useEffect, useState } from "react";

/**
 * Flash-style countdown that looks like the reference "Daily Flash Deals" timer:
 * per-digit red boxes with white numerals, e.g. 1 9 : 4 5 : 0 5
 * Counts down to next midnight ICT — same logic as the main Countdown.
 */
export function FlashCountdown({ className = "" }: { className?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
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

  // 6 digits: HH MM SS as individual chars
  const digits: string[] =
    remaining === null
      ? ["-", "-", "-", "-", "-", "-"]
      : [
          Math.floor(remaining / 3_600_000),
          Math.floor((remaining % 3_600_000) / 60_000),
          Math.floor((remaining % 60_000) / 1000),
        ]
          .map((n) => String(n).padStart(2, "0"))
          .join("")
          .split("");

  // digits[0] digits[1] : digits[2] digits[3] : digits[4] digits[5]
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-label="Time left today">
      <span className="flex items-center gap-0.5">
        <span className="flex h-6 min-w-[22px] items-center justify-center rounded-[4px] bg-[#D63A2B] px-1 text-[13px] font-bold tabular-nums leading-none text-white" data-num>
          {digits[0]}
        </span>
        <span className="flex h-6 min-w-[22px] items-center justify-center rounded-[4px] bg-[#D63A2B] px-1 text-[13px] font-bold tabular-nums leading-none text-white" data-num>
          {digits[1]}
        </span>
      </span>
      <span className="px-0.5 text-[13px] font-bold leading-none text-[#D63A2B]">:</span>
      <span className="flex items-center gap-0.5">
        <span className="flex h-6 min-w-[22px] items-center justify-center rounded-[4px] bg-[#D63A2B] px-1 text-[13px] font-bold tabular-nums leading-none text-white" data-num>
          {digits[2]}
        </span>
        <span className="flex h-6 min-w-[22px] items-center justify-center rounded-[4px] bg-[#D63A2B] px-1 text-[13px] font-bold tabular-nums leading-none text-white" data-num>
          {digits[3]}
        </span>
      </span>
      <span className="px-0.5 text-[13px] font-bold leading-none text-[#D63A2B]">:</span>
      <span className="flex items-center gap-0.5">
        <span className="flex h-6 min-w-[22px] items-center justify-center rounded-[4px] bg-[#D63A2B] px-1 text-[13px] font-bold tabular-nums leading-none text-white" data-num>
          {digits[4]}
        </span>
        <span className="flex h-6 min-w-[22px] items-center justify-center rounded-[4px] bg-[#D63A2B] px-1 text-[13px] font-bold tabular-nums leading-none text-white" data-num>
          {digits[5]}
        </span>
      </span>
    </span>
  );
}
