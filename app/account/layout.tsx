import Link from "next/link";
import { requireUser } from "@/lib/dal";

/*
  Everything under /account. `requireUser()` here is not the security boundary — a layout does
  not control whether its children render, and the Next auth guide is explicit about that — so
  every page below calls it too. This is here for the greeting and the tabs.

  Deliberately no `dynamic = "force-dynamic"`. These routes are already dynamic by construction:
  the DAL reads `cookies()`, which cannot be prerendered. Forcing it as well stops `refresh()`
  from a Server Action re-rendering the page the person is looking at — deleting a review would
  work in the database and leave the list showing it until a manual reload. With no DATABASE_URL
  configured, accounts are switched off and these become prerendered redirects to /signin, which
  is the right answer for a site that has no accounts.
*/

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");

  return (
    <div className="shell py-8">
      <p className="kicker text-muted">Your account</p>
      <h1 className="mt-1.5 text-[26px] leading-tight sm:text-[30px]">{user.displayName}</h1>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Account sections">
        <Tab href="/account">Overview</Tab>
        <Tab href="/account/saved">Saved items</Tab>
        <Tab href="/account/reviews">Your reviews</Tab>
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}

/*
  A link, not a client component reading usePathname: marking the current tab would be the only
  reason to ship JavaScript here, and the heading above already says which page you are on.
*/
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
