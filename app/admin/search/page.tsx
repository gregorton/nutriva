import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { topSearches, zeroResultSearches } from "@/lib/admin-stats";
import { RankTable } from "@/components/admin/rank-table";
import { reviewCount } from "@/lib/format";

export const metadata: Metadata = { title: "Search" };

const WINDOW = 30;

/*
  What people type into the field, and — the reason this page exists — what they typed that this
  shop could not answer. A query with no results is a stock decision waiting to be made.

  Only submitted searches are here. Suggestions come from /api/search/suggest, which is cached at
  the CDN with `Netlify-Vary: query=q`, and a response served from that cache never reaches the
  origin to be counted. So these are queries somebody committed to, not keystrokes.
*/
export default async function AdminSearchPage() {
  await requireAdmin("/admin/search");

  const [top, empty] = await Promise.all([
    topSearches(WINDOW, 30),
    zeroResultSearches(WINDOW, 30),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <RankTable
          caption={`Found nothing · last ${WINDOW} days`}
          columns={["Query", "Searches"]}
          rows={empty.map((row) => ({
            key: row.slug,
            cells: [<Query key="q" text={row.slug} />, reviewCount(row.count)],
          }))}
          empty="Nothing came back empty. Either the catalogue covers what people ask for, or nobody has searched yet."
        />
        <p className="facts mt-2 max-w-[62ch]">
          A query drops off this list on its own once the catalogue starts matching it — the result
          count is re-read on every search, not frozen at the first one.
        </p>
      </section>

      <section>
        <RankTable
          caption={`Most searched · last ${WINDOW} days`}
          columns={["Query", "Searches", "Results"]}
          rows={top.map((row) => ({
            key: row.query,
            cells: [
              <Query key="q" text={row.query} />,
              reviewCount(row.count),
              row.results === 0 ? "0" : reviewCount(row.results),
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
    <Link href={`/search?q=${encodeURIComponent(text)}`} className="hover:underline">
      {text}
    </Link>
  );
}
