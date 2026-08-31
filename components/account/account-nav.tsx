"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
  The account sidebar. The one place in this area that ships JavaScript, and it earns it: the
  sections used to be an unmarked strip, so nothing on the page said which of them you were looking
  at. `usePathname` is the only way a layout can know that — a layout does not receive the URL — and
  /account is already dynamic by construction (the DAL reads `cookies()`), so a client island here
  costs no prerendered route.

  Two levels: a category, and under it the pages that belong to it. Size and weight carry the
  difference rather than an indent alone, so the hierarchy survives at the small end.

  Below `lg` the whole thing flattens into one wrapped row of every destination. That is
  `display: contents` on the group, not a second copy of the markup — the groups stop generating
  boxes and their links become items of the nav's own flex row. A grouped list would be eight rows
  of chrome above every page on a phone; a wrapped row is two.
*/
const GROUPS: { href: string; label: string; items: { href: string; label: string }[] }[] = [
  {
    href: "/account",
    label: "Your account",
    items: [
      { href: "/account/profile", label: "Profile" },
      { href: "/account/addresses", label: "Address book" },
      { href: "/account/payment", label: "Payment options" },
    ],
  },
  { href: "/account/orders", label: "Orders", items: [] },
  { href: "/account/saved", label: "Saved items", items: [] },
  { href: "/account/reviews", label: "Reviews", items: [] },
];

export function AccountNav() {
  const pathname = usePathname();

  // Overview matches its own URL only; every other entry owns what sits beneath it, so an order
  // detail page keeps Orders marked. A category is never marked for a child of its own — the child
  // is in the list, and marking both would say you were in two places.
  const current = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Account sections"
      className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line-strong pb-3 lg:block lg:border-0 lg:pb-0"
    >
      {GROUPS.map((group) => (
        <div key={group.href} className="contents lg:mt-5 lg:block lg:first:mt-0">
          <Entry href={group.href} current={current(group.href)} level="category">
            {group.label}
          </Entry>
          {group.items.map((item) => (
            <Entry key={item.href} href={item.href} current={current(item.href)} level="item">
              {item.label}
            </Entry>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Entry({
  href,
  current,
  level,
  children,
}: {
  href: string;
  current: boolean;
  level: "category" | "item";
  children: React.ReactNode;
}) {
  const size =
    level === "category"
      ? "text-[15px] font-semibold lg:text-[15.5px]"
      : "text-[14px] lg:pl-3.5 lg:text-[13.5px]";

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`-mb-px shrink-0 border-b-2 pb-1.5 transition-colors lg:mt-1.5 lg:block lg:border-b-0 lg:pb-0 ${size} ${
        current
          ? "border-plum-700 font-semibold text-plum-700"
          : `border-transparent hover:text-ink ${level === "category" ? "text-ink" : "text-muted"}`
      }`}
    >
      {children}
    </Link>
  );
}
