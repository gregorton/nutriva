import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { robots: { index: false } };

/*
  Everything under /account. `requireUser()` here is not the security boundary — a layout does
  not control whether its children render, and the Next auth guide is explicit about that — so
  every page below calls it too. This is here for the identity card and the sections.

  Deliberately no `dynamic = "force-dynamic"`. These routes are already dynamic by construction:
  the DAL reads `cookies()`, which cannot be prerendered. Forcing it as well stops `refresh()`
  from a Server Action re-rendering the page the person is looking at — deleting a review would
  work in the database and leave the list showing it until a manual reload. With no DATABASE_URL
  configured, accounts are switched off and these become prerendered redirects to /signin, which
  is the right answer for a site that has no accounts.

  The shape is a sidebar rather than the tab strip it used to be: four sections that each hold a
  list want a fixed rail beside the list, not a row of links that scrolls away with it. The rail
  sticks below the pinned chrome, so `--spacing-chrome` is the offset here for the same reason
  the buy box uses it.
*/
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  // Array.from, not charAt: a name whose first character is outside the BMP would come back as
  // half a surrogate pair.
  const initial = Array.from(user.displayName.trim())[0]?.toUpperCase() ?? "?";

  return (
    <div className="shell py-6 pb-14">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Your account" }]} />
      <h1 className="mt-3 text-[28px] leading-none tracking-tight sm:text-[34px]">Your account</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10">
        <aside>
          <div className="space-y-4 lg:sticky lg:top-[calc(var(--spacing-chrome)+1.5rem)]">
            <div className="banner-plum flex items-center gap-3.5 rounded-tile p-4 text-white">
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-[19px] font-semibold ring-1 ring-white/25"
              >
                {initial}
              </span>
              <div className="min-w-0">
                <p className="kicker text-plum-200">Signed in</p>
                <p className="mt-0.5 truncate text-[17px] font-semibold leading-tight">
                  {user.displayName}
                </p>
              </div>
            </div>

            <AccountNav />
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
