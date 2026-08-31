import Link from "next/link";
import type { CategorySlug, Product } from "@/lib/catalog";
import { activeFilters, applyFilters, applySort, SORTS } from "@/lib/listing";
import { setHref, toggleHref, values, type RawSearchParams } from "@/lib/query";
import { FilterRail } from "@/components/plp/filter-rail";
import { SortSelect } from "@/components/plp/sort-select";
import { ProductGrid } from "@/components/product/product-grid";
import { CloseIcon } from "@/components/ui/icons";

/*
  The body of every listing page: rail, count, sort, removable chips, grid.

  It was the second half of the category page. /search, /new and /b/[brand] want the same thing,
  so it moved here and takes the pool plus the URL — filtering and sorting stay in lib/listing.ts,
  and this file only lays them out. Filters are links, so all of it works with no JavaScript.
*/
export function ProductListing({
  base,
  raw,
  pool,
  /** A category page passes its slug so the `refine` rail tiles apply. */
  slug,
  defaultSort = "recommended",
  sortOptions = SORTS,
  showBrands = true,
  /** /search ranks by score, which `applySort` must leave alone. */
  presorted = false,
}: {
  base: string;
  raw: RawSearchParams;
  pool: Product[];
  slug?: CategorySlug;
  defaultSort?: string;
  sortOptions?: readonly { id: string; label: string }[];
  showBrands?: boolean;
  presorted?: boolean;
}) {
  const filtered = applyFilters(pool, raw, slug);
  const sort = values(raw, "sort")[0] ?? defaultSort;
  const items = presorted && sort === defaultSort ? filtered : applySort(filtered, sort);
  const chips = activeFilters(raw);

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <FilterRail base={base} raw={raw} pool={pool} showBrands={showBrands} />
      </aside>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink" data-num>
              {items.length}
            </span>{" "}
            {items.length === 1 ? "product" : "products"}
            {items.length !== pool.length && (
              <>
                {" "}
                of <span data-num>{pool.length}</span>
              </>
            )}
          </p>
          <SortSelect base={base} current={sort} options={sortOptions} />
        </div>

        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((filter) => (
              <li key={`${filter.key}-${filter.value}`}>
                <Link
                  href={toggleHref(base, raw, filter.key, filter.value)}
                  scroll={false}
                  className="flex h-7 items-center gap-1.5 rounded-full bg-plum-100 px-3 text-[12.5px] font-medium text-plum-800 transition-colors hover:bg-plum-200"
                >
                  {filter.label}
                  <CloseIcon className="h-3 w-3" />
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={setHref(base, {}, "sort", sort)}
                scroll={false}
                className="facts px-1 text-plum-700 underline underline-offset-4 hover:text-plum-600"
              >
                Clear all
              </Link>
            </li>
          </ul>
        )}

        {/* Filters live in a rail on desktop; on mobile they collapse into this disclosure. */}
        <details className="mt-4 rounded-card border border-line lg:hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Filters</summary>
          <div className="border-t border-line px-4 py-4">
            <FilterRail base={base} raw={raw} pool={pool} showBrands={showBrands} />
          </div>
        </details>

        <div className="mt-5">
          {items.length > 0 ? (
            <ProductGrid products={items} />
          ) : (
            <div className="rounded-card border border-line bg-paper px-6 py-16 text-center">
              <p className="font-display text-lg">Nothing matches those filters</p>
              <p className="mt-1.5 text-sm text-muted">
                Remove a filter, or start again from the full list.
              </p>
              <Link
                href={setHref(base, {}, "sort", sort)}
                className="mt-5 inline-flex h-10 items-center rounded-[7px] bg-plum-800 px-5 text-sm font-semibold text-white hover:bg-plum-700"
              >
                Show all {pool.length} products
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
