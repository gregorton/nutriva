import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { robots: { index: false } };

/*
  Everything under /account. `requireUser()` here is not the security boundary — a layout does
  not control whether its children render, and the Next auth guide is explicit about that — so
  every page below calls it too. This is here for the greeting and the sections.

  Deliberately no `dynamic = "force-dynamic"`. These routes are already dynamic by construction:
  the DAL reads `cookies()`, which cannot be prerendered. Forcing it as well stops `refresh()`
  from a Server Action re-rendering the page the person is looking at — deleting a review would
  work in the database and leave the list showing it until a manual reload. With no DATABASE_URL
  configured, accounts are switched off and these become prerendered redirects to /signin, which
  is the right answer for a site that has no accounts.

  The account area is the one part of the storefront that runs on a grey ground rather than white:
  the sections each hold a list, and a list reads as a thing you can act on when it sits in a white
  panel on a field. The grey is a plain neutral and deliberately not `paper` or `paper-warm` — the
  warm tint is the storefront's shelf ground, and a page of white panels on it looks unwashed. The
  sidebar sticks below the pinned chrome, so `--spacing-chrome` is the offset here for the same
  reason the buy box uses it.
*/
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");

  return (
    <div className="squared bg-[#eef0f2]">
      <div className="shell py-6 pb-14">
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Your account" }]} />
        <h1 className="mt-2.5 text-[26px] font-semibold leading-none tracking-tight sm:text-[30px]">
          Your account
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[204px_minmax(0,1fr)] lg:gap-8">
          <aside>
            <div className="lg:sticky lg:top-[calc(var(--spacing-chrome)+1.5rem)]">
              <p className="facts mb-3 hidden lg:block">
                Hello, <span className="font-semibold text-ink">{user.displayName}</span>
              </p>
              <AccountNav />
            </div>
          </aside>

          <div className="min-w-0 space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
