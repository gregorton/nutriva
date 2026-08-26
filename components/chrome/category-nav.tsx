"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, GOALS } from "@/lib/catalog";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * Category row with a hover/focus panel. The panel shows that category's own subcategory
 * chips plus the goals that map to it, so both entry paths — taxonomy and intent — are
 * reachable from one place.
 */
export function CategoryNav() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = CATEGORIES.find((c) => c.slug === openSlug) ?? null;
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const scheduleOpen = (slug: string) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (enterTimer.current) clearTimeout(enterTimer.current);
    if (openSlug === slug) return;
    enterTimer.current = setTimeout(() => setOpenSlug(slug), 140);
  };

  const scheduleClose = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setOpenSlug(null), 90);
  };

  const keepOpen = (slug: string) => {
    clearTimers();
    setOpenSlug(slug);
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <nav
      aria-label="Product categories"
      className="relative bg-plum-800 text-white"
      onMouseLeave={scheduleClose}
    >
      <div className="shell">
        <ul className="rail flex items-stretch gap-1 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/c/${category.slug}`}
                onMouseEnter={() => scheduleOpen(category.slug)}
                onFocus={() => keepOpen(category.slug)}
                className={`flex h-11 items-center whitespace-nowrap px-3 text-[13.5px] font-medium transition-colors hover:bg-plum-700 ${
                  openSlug === category.slug ? "bg-plum-700" : ""
                }`}
              >
                {category.name}
              </Link>
            </li>
          ))}

          <li className="ml-auto flex items-center gap-1 pl-3">
            <Link
              href="/starters"
              className="flex h-11 items-center whitespace-nowrap px-3 text-[13.5px] font-semibold text-turmeric-500 transition-colors hover:bg-plum-700"
            >
              Starter kits
            </Link>
            <Link
              href="/deals"
              className="hidden h-11 items-center whitespace-nowrap px-3 text-[13.5px] font-medium transition-colors hover:bg-plum-700 sm:flex"
            >
              Deals
            </Link>
            <Link
              href="/guides"
              className="hidden h-11 items-center whitespace-nowrap px-3 text-[13.5px] font-medium transition-colors hover:bg-plum-700 sm:flex"
            >
              Guides
            </Link>
          </li>
        </ul>
      </div>

      {open && (
        <div
          className="absolute inset-x-0 top-full z-40 hidden border-b border-line bg-white shadow-[0_18px_40px_-24px_rgba(43,15,32,0.45)] md:block"
          onMouseEnter={() => keepOpen(open.slug)}
          onMouseLeave={scheduleClose}
        >
          <div className="shell grid grid-cols-[1.6fr_1fr] gap-10 py-6">
            <div>
              <p className="kicker text-muted">Shop {open.name.toLowerCase()}</p>
              <ul className="mt-3 grid grid-cols-3 gap-x-6 gap-y-2">
                {open.chips.map((chip) => (
                  <li key={chip}>
                    <Link
                      href={`/c/${open.slug}?refine=${encodeURIComponent(chip)}`}
                      className="text-sm text-ink underline-offset-4 hover:text-plum-700 hover:underline"
                    >
                      {chip}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/c/${open.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-plum-700 hover:text-plum-600"
              >
                All {open.name.toLowerCase()}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="border-l border-line pl-8">
              <p className="kicker text-muted">Shop by goal</p>
              <ul className="mt-3 space-y-2">
                {GOALS.slice(0, 4).map((goal) => (
                  <li key={goal.slug}>
                    <Link href={`/c/${goal.category}`} className="group block">
                      <span className="text-sm font-medium text-ink group-hover:text-plum-700">{goal.label}</span>
                      <span className="facts block">{goal.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
