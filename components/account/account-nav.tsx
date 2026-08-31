"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
  The account sidebar. The one place in this area that ships JavaScript, and it earns it: the
  sections used to be an unmarked strip, so nothing on the page said which of the four you were
  looking at. `usePathname` is the only way a layout can know that — a layout does not receive the
  URL — and /account is already dynamic by construction (the DAL reads `cookies()`), so a client
  island here costs no prerendered route.

  Plain text, no boxes and no glyphs: it sits on the grey field beside white panels, and a pill or
  an icon per row would compete with them. Colour alone marks the section from `lg` up; below that
  the four sit in a row and the current one carries an underline as well, because a row of links
  needs more than a shade to say which is which.
*/
const SECTIONS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/reviews", label: "Reviews" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account sections"
      className="flex gap-5 border-b border-line-strong text-[14px] lg:flex-col lg:gap-0 lg:border-0"
    >
      {SECTIONS.map(({ href, label }) => {
        // Overview matches its own URL only; the others own everything beneath them, so an
        // order detail page keeps Orders marked.
        const current = href === "/account" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 pb-2.5 transition-colors lg:border-b-0 lg:py-1.5 ${
              current
                ? "border-plum-700 font-semibold text-plum-700"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
