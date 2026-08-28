import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  byCategory,
  type CategorySlug,
  type Product,
} from "@/lib/catalog";
import { setHref, toggleHref, values, type RawSearchParams } from "@/lib/query";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterRail, PRICE_BUCKETS } from "@/components/plp/filter-rail";
import { SortSelect } from "@/components/plp/sort-select";
import { CategoryTypeRail } from "@/components/plp/category-type-rail";
import { inSubcategory } from "@/lib/subcategories";
import { CloseIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug as CategorySlug);
  if (!category) return {};
  return { title: category.name, description: category.blurb };
}

function applyFilters(pool: Product[], raw: RawSearchParams, slug: CategorySlug): Product[] {
  const brands = values(raw, "brand");
  const forms = values(raw, "form");
  const prices = values(raw, "price");
  const onSale = values(raw, "sale").includes("1");
  const minRating = Number(values(raw, "rating")[0] ?? 0);
  const refine = values(raw, "refine")[0];

  return pool.filter((product) => {
    if (brands.length && !brands.includes(product.brand)) return false;
    if (forms.length && !forms.some((form) => (product.form ?? "").toLowerCase().includes(form.toLowerCase())))
      return false;
    if (prices.length) {
      const inBucket = prices.some((id) => {
        const bucket = PRICE_BUCKETS.find((b) => b.id === id);
        return bucket && product.price >= bucket.min && product.price < bucket.max;
      });
      if (!inBucket) return false;
    }
    if (onSale && !product.discount) return false;
    if (minRating && product.rating < minRating) return false;
    // A refine value is a rail tile's label, matched by that tile's own terms; anything else
    // falls back to a plain substring match.
    if (refine && !inSubcategory(product, slug, refine)) return false;
    return true;
  });
}

function applySort(items: Product[], sort: string): Product[] {
  const sorted = [...items];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    case "reviews":
      return sorted.sort((a, b) => b.reviews - a.reviews);
    case "discount":
      return sorted.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    default:
      return sorted.sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0) || b.reviews - a.reviews);
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug as CategorySlug);
  if (!category) notFound();

  const raw = (await searchParams) as RawSearchParams;
  const base = `/c/${category.slug}`;
  const pool = byCategory(category.slug);
  const filtered = applyFilters(pool, raw, category.slug);
  const sort = values(raw, "sort")[0] ?? "recommended";
  const items = applySort(filtered, sort);

  const activeChip = values(raw, "refine")[0];
  const activeFilters = [
    ...(activeChip ? [{ key: "refine", value: activeChip, label: activeChip }] : []),
    ...values(raw, "brand").map((v) => ({ key: "brand", value: v, label: v })),
    ...values(raw, "form").map((v) => ({ key: "form", value: v, label: v })),
    ...values(raw, "price").map((v) => ({
      key: "price",
      value: v,
      label: PRICE_BUCKETS.find((b) => b.id === v)?.label ?? v,
    })),
    ...values(raw, "rating").map((v) => ({ key: "rating", value: v, label: `${v}+ rating` })),
    ...(values(raw, "sale").includes("1") ? [{ key: "sale", value: "1", label: "On offer" }] : []),
  ];

  return (
    <div className="shell py-6">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: category.name }]} />

      <header className="mt-3 border-b border-line pb-5">
        <h1 className="text-[28px] sm:text-[34px]">{category.name}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{category.blurb}</p>

        {/* Browse the category by type before filtering it — see CategoryTypeRail. */}
        <CategoryTypeRail
          slug={category.slug}
          name={category.name}
          base={base}
          raw={raw}
          active={activeChip}
        />
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <FilterRail base={base} raw={raw} pool={pool} />
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
            <SortSelect base={base} current={sort} />
          </div>

          {activeFilters.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
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
                  href={base}
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
              <FilterRail base={base} raw={raw} pool={pool} />
            </div>
          </details>

          <div className="mt-5">
            {items.length > 0 ? (
              <ProductGrid products={items} />
            ) : (
              <div className="rounded-card border border-line bg-paper px-6 py-16 text-center">
                <p className="font-display text-lg">Nothing matches those filters</p>
                <p className="mt-1.5 text-sm text-muted">Remove a filter, or start again from the full category.</p>
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
    </div>
  );
}
