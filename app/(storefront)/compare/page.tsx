import Link from "next/link";
import type { Metadata } from "next";
import { getProduct, type Product } from "@/lib/catalog";
import { values, type RawSearchParams } from "@/lib/query";
import { COMPARE_LIMIT } from "@/components/product/compare-store";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CompareTable } from "@/components/product/compare-table";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export const metadata: Metadata = {
  title: "Compare",
  description: "Two to four supplement-facts panels side by side.",
  robots: { index: false },
};

/*
  The comparison lives in the URL — /compare?p=slug&p=slug — so it is shareable, back-navigable and
  works with no JavaScript. The tray that builds the selection is the client half; this page reads
  `searchParams` and nothing else, which is why it needs no store of its own.

  What makes this worth having here rather than being a generic e-commerce widget: the
  supplement-facts panels are real, read off the label, so lining two up compares actual amounts and
  %DV rather than marketing copy.
*/
export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const raw = (await searchParams) as RawSearchParams;

  const products = values(raw, "p")
    .map(getProduct)
    .filter((product): product is Product => product !== undefined)
    .slice(0, COMPARE_LIMIT);

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="compare" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Compare" }]} />

      <header className="mt-3 border-b border-line pb-5">
        <p className="kicker text-muted">Label against label</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[34px]">Compare</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted">
          Amounts and %DV as each label prints them. A dash means that label does not state the row
          at all, which is not the same as stating zero.
        </p>
      </header>

      {products.length < 2 ? (
        <div className="mt-6 rounded-card border border-line bg-paper px-6 py-14 text-center">
          <p className="font-display text-lg">Pick at least two products</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm text-muted">
            Tick <strong className="font-semibold text-ink">Compare</strong> on any product card and
            a bar appears at the foot of the page. Up to {COMPARE_LIMIT} at a time.
          </p>
          <Link
            href="/c/minerals"
            className="mt-6 inline-flex h-10 items-center rounded-[7px] bg-plum-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
          >
            Start with minerals
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <CompareTable products={products} />
        </div>
      )}
    </div>
  );
}
