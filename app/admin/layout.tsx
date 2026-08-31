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
  { href: "/admin/orders", label: "orders" },
  { href: "/admin/reviews", label: "reviews" },
  { href: "/admin/products", label: "products" },
  { href: "/admin/search", label: "search" },
];

/*
  Everything under /admin — a site of its own, not a page of the shop.

  /admin sits outside the `(storefront)` route group, so the only layout above this one is the
  document: no utility bar, no masthead, no category nav, no footer, no cart drawer. That is why the
  two links in the top bar matter — with the masthead gone, they are the only way back out.

  `requireAdmin()` here is for the title bar and the tabs, not the boundary: a layout does not
  control whether its children render, so every page below calls it too — the rule
  app/(storefront)/account/layout.tsx already states.

  Deliberately no `dynamic = "force-dynamic"`. These routes are already request-time because the gate
  reads the session cookie, and forcing it as well breaks `refresh()`.
*/
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className={`${jetbrains.variable} flex flex-1 flex-col bg-term-950 font-term text-term-text`}>
      <header className="sticky top-0 z-10 border-b border-term-line bg-term-900">
        <div className="shell flex h-11 items-center gap-3">
          <span className="flex shrink-0 gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-term-alert/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-turmeric-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-term-cyan/70" />
          </span>
          <p className="truncate text-[11.5px] tracking-wide text-term-dim">
            swa-admin — read-only — {user.displayName}
          </p>
          <span className="flex-1" />
          <nav className="flex shrink-0 gap-3 text-[11.5px]" aria-label="Leave the dashboard">
            <Link href="/" className="text-term-dim transition-colors hover:text-term-cyan">
              storefront ↗
            </Link>
            <Link href="/account" className="text-term-dim transition-colors hover:text-term-cyan">
              account ↗
            </Link>
          </nav>
        </div>
      </header>

      <div className="border-b border-term-line bg-term-900/40">
        <div className="shell pt-4 pb-0">
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
      </div>

      <main className="shell flex-1 py-8">{children}</main>

      <footer className="border-t border-term-line bg-term-900">
        <div className="shell flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[11px] text-term-dim">
          <span>read-only</span>
          <span aria-hidden>·</span>
          <span>days are Bangkok days</span>
          <span aria-hidden>·</span>
          <span>counters exclude everyone on the allowlist</span>
        </div>
      </footer>
    </div>
  );
}

/* A link, not a client component reading usePathname — the account layout's reasoning. */
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
