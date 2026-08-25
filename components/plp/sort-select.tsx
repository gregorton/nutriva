"use client";

import { useRouter } from "next/navigation";
import { ChevronIcon } from "@/components/ui/icons";

export const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Rating" },
  { id: "reviews", label: "Most reviewed" },
  { id: "discount", label: "Biggest discount" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

/**
 * Sort lives in the URL, so this is the one control that has to push a route. "Cost per serving"
 * used to head the list; it was computed from price and serving count rather than stated by any
 * label, and went out with the rest of the per-serving figures.
 */
export function SortSelect({ base, current }: { base: string; current: string }) {
  const router = useRouter();

  return (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="text-muted">Sort</span>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          params.set("sort", e.target.value);
          router.push(`${base}?${params.toString()}`, { scroll: false });
        }}
        className="h-9 appearance-none rounded-[7px] border border-line-strong bg-white pl-3 pr-8 text-[13.5px] font-medium text-ink focus:border-plum-600 focus:outline-none"
      >
        {SORTS.map((sort) => (
          <option key={sort.id} value={sort.id}>
            {sort.label}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-2 h-4 w-4 text-muted" />
    </label>
  );
}
