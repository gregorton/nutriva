import Link from "next/link";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Dashboard",
  // Not a secret — the gate is — but there is no reason for a search engine to hold the URL.
  robots: { index: false, follow: false, nocache: true },
};

/*
  The console face. Loaded here rather than in the root layout so it is requested on /admin and
  nowhere else, and bound to `--font-jetbrains`, which app/globals.css reads through `--font-term`.
*/
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const TABS = [
  { href: "/admin", label: "overview" },
  { href: "/admin/accounts", label: "accounts" },
  { href: "/admin/reviews", label: "reviews" },
  { href: "/admin/products", label: "products" },
  { href: "/admin/search", label: "search" },
];

/*
  Everything under /admin, dressed as a terminal.

  The dark ground is doing a job beyond taste: the storefront chrome is in the root layout and cannot
  be opted out of without moving every route into a `(storefront)` group, so this surface has to
  announce itself as not-the-shop from the first glance. Nothing here uses the brand palette.

  `requireAdmin()` here is for the window bar and the tabs, not the boundary: a layout does not
  control whether its children render, so every page below calls it too — the rule
  app/account/layout.tsx already states.

  Deliberately no `dynamic = "force-dynamic"`. These routes are already request-time because the gate
  reads the session cookie, and forcing it as well breaks `refresh()`.
*/
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className={`${jetbrains.variable} min-h-full bg-term-950 font-term text-term-text`}>
      <div className="shell py-8">
        <div className="overflow-hidden rounded-card border border-term-line">
          {/* Window bar. The dots are decoration and say so — nothing here is a control. */}
          <div className="flex items-center gap-2.5 border-b border-term-line bg-term-900 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-term-alert/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-turmeric-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-term-cyan/70" />
            </span>
            <p className="truncate text-[11.5px] tracking-wide text-term-dim">
              swa-admin — read-only — {user.displayName}
            </p>
          </div>

          <div className="bg-term-900/50 px-4 pt-4 pb-0">
            <p className="text-[13px]">
              <span className="text-term-cyan">admin@slim-wellness</span>
              <span className="text-term-dim">:~$</span> dashboard --read-only
            </p>

            <nav
              className="mt-3.5 -mb-px flex gap-1 overflow-x-auto text-[12.5px]"
              aria-label="Dashboard sections"
            >
              {TABS.map((tab) => (
                <Tab key={tab.href} href={tab.href}>
                  {tab.label}
                </Tab>
              ))}
            </nav>
          </div>

          <div className="border-t border-term-line px-4 py-7 sm:px-5">{children}</div>
        </div>

        <p className="mt-3 text-[11.5px] text-term-dim">
          Counters exclude everyone on the allowlist, so nothing you open from here moves a figure you
          read here. Days are Bangkok days.
        </p>
      </div>
    </div>
  );
}

/* A link, not a client component reading usePathname — app/account/layout.tsx's reasoning. */
function Tab({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 border border-transparent border-b-term-line px-3 py-2 text-term-dim transition-colors hover:border-term-line hover:border-b-transparent hover:bg-term-950 hover:text-term-cyan"
    >
      {children}
    </Link>
  );
}
