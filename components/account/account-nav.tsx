"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, StarIcon, TruckIcon, UserIcon } from "@/components/ui/icons";

/*
  The account sidebar. The one place in this area that ships JavaScript, and it earns it: the
  sections used to be an unmarked tab strip, so nothing on the page said which of the four you
  were looking at. `usePathname` is the only way a layout can know that — a layout does not
  receive the URL — and /account is already dynamic by construction (the DAL reads `cookies()`),
  so a client island here costs no prerendered route.

  Vertical from `lg` up, a horizontal row below it. The glyphs are `lg`-only: four labelled links
  with an icon each overflow a 375px frame, and a nav that has to be scrolled to reach its last
  section is worse than one without pictures.
*/
const SECTIONS: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/account", label: "Overview", icon: UserIcon },
  { href: "/account/orders", label: "Orders", icon: TruckIcon },
  { href: "/account/saved", label: "Saved", icon: HeartIcon },
  { href: "/account/reviews", label: "Reviews", icon: StarIcon },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account sections"
      className="rail -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0"
    >
      {SECTIONS.map(({ href, label, icon: Icon }) => {
        // Overview matches its own URL only; the others own everything beneath them, so an
        // order detail page keeps Orders marked.
        const current = href === "/account" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
              current
                ? "bg-plum-100 text-plum-800"
                : "text-muted hover:bg-paper hover:text-ink"
            }`}
          >
            <Icon
              className={`hidden h-[17px] w-[17px] shrink-0 lg:block ${current ? "text-plum-700" : "text-faint"}`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
