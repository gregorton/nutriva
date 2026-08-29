import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, search } from "@/lib/catalog";
import { didYouMean } from "@/lib/search-suggest";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { values, type RawSearchParams } from "@/lib/query";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams) as RawSearchParams;
  const query = values(raw, "q")[0] ?? "";
  const results = search(query);
  // The same nearest-vocabulary guess the dropdown offers, from the same module, so a suggestion and
  // this page can never name different words for one typo.
  const suggestion = results.length === 0 && query.trim() ? didYouMean(query) : null;

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="search" />
      {/* Only a submitted query is counted; the cached suggestion endpoint cannot report one. */}
      {query.trim() && <ViewBeacon kind="search" value={query} />}
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Search" }]} />

      <header className="mt-3 border-b border-line pb-5">
        <h1 className="text-[26px] sm:text-[32px]">
          {query ? <>Results for “{query}”</> : "Search"}
        </h1>
        {query && (
          <p className="mt-1.5 text-sm text-muted">
            <span className="font-semibold text-ink" data-num>
              {results.length}
            </span>{" "}
            {results.length === 1 ? "product" : "products"}
          </p>
        )}
      </header>

      {results.length > 0 ? (
        <div className="mt-6">
          <ProductGrid products={results} />
        </div>
      ) : (
        <div className="mt-6 rounded-card border border-line bg-paper px-6 py-14 text-center">
          <p className="font-display text-lg">
            {query ? <>Nothing matched “{query}”</> : "Type what you are looking for"}
          </p>
          {suggestion ? (
            <p className="mt-3 text-[15px]">
              Did you mean{" "}
              <Link href={suggestion.href} className="font-semibold text-plum-700 underline">
                {suggestion.label}
              </Link>
              ? <span className="text-muted">({suggestion.count} products)</span>
            </p>
          ) : null}
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Try a nutrient (magnesium), a format (gummies) or a brand. Or start from a category:
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/c/${category.slug}`}
                  className="flex h-8 items-center rounded-full border border-line-strong bg-white px-3.5 text-[13px] font-medium transition-colors hover:border-plum-600 hover:text-plum-700"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
