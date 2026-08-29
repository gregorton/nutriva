import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Dashboard",
  // Not a secret — the gate is — but there is no reason for a search engine to hold the URL.
  robots: { index: false, follow: false, nocache: true },
};

/*
  Everything under /admin.

  `requireAdmin()` here is for the bar and the tabs, not the boundary: a layout does not control
  whether its children render, so every page below calls it too — the rule app/account/layout.tsx
  already states, and the reason the Next auth guide gives for it.

  Deliberately no `dynamic = "force-dynamic"`. These routes are already request-time because the
  gate reads the session cookie, and forcing it as well breaks `refresh()`.

  The storefront chrome stays around this page. Escaping it would mean moving every existing route
  into a `(storefront)` group for the sake of five pages, so instead the plum bar below says
  plainly which side of the site you are looking at.
*/
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className="shell py-8">
      <div className="rounded-tile bg-plum-800 px-5 py-4 text-white">
        <p className="kicker text-plum-200">Internal dashboard</p>
        <h1 className="mt-1 text-[24px] leading-tight text-white sm:text-[28px]">
          Slim Wellness Asia
        </h1>
        <p className="mt-1.5 text-[13px] text-plum-200">
          Signed in as {user.displayName}. Read-only: nothing here changes anything.
        </p>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Dashboard sections">
        <Tab href="/admin">Overview</Tab>
        <Tab href="/admin/accounts">Accounts</Tab>
        <Tab href="/admin/reviews">Reviews</Tab>
        <Tab href="/admin/products">Products</Tab>
        <Tab href="/admin/search">Search</Tab>
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}

/* A link, not a client component reading usePathname — app/account/layout.tsx's reasoning. */
function Tab({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-mb-px shrink-0 border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
    >
      {children}
    </Link>
  );
}
