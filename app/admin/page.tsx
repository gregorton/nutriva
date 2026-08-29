import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { overview, providerSplit, signupsByDay, surfaceViews, viewsByDay } from "@/lib/admin-stats";
import { BarChart } from "@/components/admin/bar-chart";
import { RankTable } from "@/components/admin/rank-table";
import { StatTile } from "@/components/admin/stat-tile";
import { reviewCount } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const WINDOW = 30;

/*
  Overview. Two tile rows — what the database holds, and what happened today — then the two day series,
  then how people get in and which surfaces they open.

  "Today" is Bangkok's day throughout, not the database's: Neon runs this project in GMT, and for the
  first seven hours of every Thai day the two disagree.
*/
export default async function AdminOverviewPage() {
  await requireAdmin();

  const [stats, signups, views, providers, surfaces] = await Promise.all([
    overview(),
    signupsByDay(WINDOW),
    viewsByDay(WINDOW),
    providerSplit(),
    surfaceViews(WINDOW),
  ]);

  return (
    <div className="space-y-9">
      <section>
        <Heading>what the database holds</Heading>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Accounts" value={stats.accounts} href="/admin/accounts" />
          <StatTile label="Reviews" value={stats.reviews} href="/admin/reviews" />
          <StatTile label="Saved items" value={stats.saved} href="/admin/products" />
          <StatTile
            label="Live sessions"
            value={stats.liveSessions}
            note="Unexpired session rows, not people online."
          />
        </div>
      </section>

      <section>
        <Heading>today in bangkok</Heading>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="New accounts" value={stats.accountsToday} />
          <StatTile
            label="Products opened"
            value={stats.productViewsToday}
            note="One per product per browser."
          />
          <StatTile label="Other pages opened" value={stats.pageViewsToday} />
          <StatTile
            label="Searches"
            value={stats.searchesToday}
            note={`${reviewCount(stats.zeroResultToday)} found nothing.`}
            href="/admin/search"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <BarChart points={signups} label={`signups · ${WINDOW}d`} tone="turmeric" />
        <BarChart points={views.products} label={`products opened · ${WINDOW}d`} tone="cyan" />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <RankTable
            caption="how people sign in"
            columns={["Method", "Accounts"]}
            rows={[
              { key: "password", cells: ["password", reviewCount(providers.password)] },
              { key: "google", cells: ["google linked", reviewCount(providers.google)] },
              { key: "facebook", cells: ["facebook linked", reviewCount(providers.facebook)] },
              { key: "none", cells: ["no password set", reviewCount(providers.providerOnly)] },
            ]}
            empty="No accounts yet."
          />
          <Note>
            Counts, not shares — an account with a password and a linked provider appears on two rows.
          </Note>
        </div>

        <div>
          <RankTable
            caption={`pages opened · ${WINDOW}d`}
            columns={["Surface", "Opened"]}
            rows={surfaces.map((row) => ({
              key: row.surface,
              cells: [row.surface, reviewCount(row.count)],
            }))}
            empty="Nothing recorded yet. Counters fill as soon as somebody who is not on the allowlist opens a page."
          />
          <Note>Product pages are counted separately, under products.</Note>
        </div>
      </section>
    </div>
  );
}

/** A section heading set as a shell comment, which is the whole reason it is lowercase. */
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-normal tracking-wide text-term-dim">
      <span className="text-term-cyan" aria-hidden>
        #{" "}
      </span>
      {children}
    </h2>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 max-w-[52ch] text-[11.5px] leading-snug text-term-dim">{children}</p>;
}
