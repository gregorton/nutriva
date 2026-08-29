import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { topSearches, zeroResultSearches } from "@/lib/admin-stats";
import { RankTable } from "@/components/admin/rank-table";
import { reviewCount } from "@/lib/format";

export const metadata: Metadata = { title: "Search" };

const WINDOW = 30;

/*
  What people type into the field, and — the reason this page exists — what they typed that this shop
  could not answer. A query with no results is a stock decision waiting to be made.

  Only submitted searches are here, because /api/search/suggest counts nothing: it calls `suggest()`
  and returns, and the one writer of these figures is /search itself. So these are queries somebody
  committed to, not keystrokes — and that holds however the suggestion route happens to be cached.
*/
export default async function AdminSearchPage() {
  await requireAdmin("/admin/search");

  const [top, empty] = await Promise.all([topSearches(WINDOW, 30), zeroResultSearches(WINDOW, 30)]);

  return (
    <div className="space-y-9">
      <section>
        <RankTable
          caption={`found nothing · ${WINDOW}d`}
          columns={["Query", "Searches"]}
          rows={empty.map((row) => ({
            key: row.slug,
            cells: [<Query key="q" text={row.slug} />, reviewCount(row.count)],
          }))}
          empty="Nothing came back empty. Either the catalogue covers what people ask for, or nobody has searched yet."
        />
        <Note>
          A query drops off this list on its own once the catalogue starts matching it — the result count
          is re-read on every search, not frozen at the first one.
        </Note>
      </section>

      <section>
        <RankTable
          caption={`most searched · ${WINDOW}d`}
          columns={["Query", "Searches", "Results"]}
          rows={top.map((row) => ({
            key: row.query,
            cells: [
              <Query key="q" text={row.query} />,
              reviewCount(row.count),
              row.results === 0 ? (
                <span className="text-term-alert">0</span>
              ) : (
                reviewCount(row.results)
              ),
            ],
          }))}
          empty="Nothing recorded yet."
        />
      </section>
    </div>
  );
}

/** Links to the results page, so a figure can be checked against what a shopper actually sees. */
function Query({ text }: { text: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(text)}`}
      className="transition-colors hover:text-term-cyan"
    >
      {text}
    </Link>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 max-w-[64ch] text-[11.5px] leading-snug text-term-dim">{children}</p>;
}
