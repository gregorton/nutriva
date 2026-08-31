import type { CategorySlug, Product } from "@/lib/catalog";
import { values, type RawSearchParams } from "@/lib/query";
import { inSubcategory } from "@/lib/subcategories";

/*
  Filtering and sorting a list of products.

  This used to be two functions inside app/(storefront)/c/[slug]/page.tsx. Four surfaces now need
  them — the category page, /search, /new and /b/[brand] — so they live here instead of being
  copied. Everything reads from the URL through lib/query.ts, so a filter is still a link.

  Nothing here is a data source: it takes a pool a caller already chose and narrows it.
*/

export const PRICE_BUCKETS = [
  { id: "0-400", label: "Under ฿400", min: 0, max: 400 },
  { id: "400-800", label: "฿400 – ฿800", min: 400, max: 800 },
  { id: "800-1500", label: "฿800 – ฿1,500", min: 800, max: 1500 },
  { id: "1500-99999", label: "฿1,500 and up", min: 1500, max: Number.MAX_SAFE_INTEGER },
];

export const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Rating" },
  { id: "reviews", label: "Most reviewed" },
  { id: "discount", label: "Biggest discount" },
  { id: "newest", label: "Newest" },
] as const;

/** /search sorts by score, so it puts relevance at the head of its own list. */
export const RELEVANCE = { id: "relevance", label: "Best match" } as const;

export type SortId = (typeof SORTS)[number]["id"] | typeof RELEVANCE.id;

/** "03/2024" -> 202403, so `firstAvailable` sorts without parsing a date. */
function firstAvailableKey(product: Product): number {
  const value = product.firstAvailable;
  if (!value) return 0;
  const [month, year] = value.split("/");
  return Number(year) * 100 + Number(month);
}

export function applyFilters(
  pool: Product[],
  raw: RawSearchParams,
  /** Only a category page has a subcategory rail, so only it can honour `refine`. */
  slug?: CategorySlug,
): Product[] {
  const brands = values(raw, "brand");
  const forms = values(raw, "form");
  const prices = values(raw, "price");
  const onSale = values(raw, "sale").includes("1");
  const inStockOnly = values(raw, "stock").includes("1");
  const minRating = Number(values(raw, "rating")[0] ?? 0);
  const refine = values(raw, "refine")[0];

  return pool.filter((product) => {
    if (inStockOnly && !product.inStock) return false;
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
    // A refine value is a rail tile's label, matched by that tile's own terms.
    if (refine && slug && !inSubcategory(product, slug, refine)) return false;
    return true;
  });
}

/**
 * `relevance` deliberately returns the input order untouched: /search hands over the ranking
 * `search()` produced, and re-sorting it would throw the scoring away.
 */
export function applySort(items: Product[], sort: string): Product[] {
  if (sort === RELEVANCE.id) return items;

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
    case "newest":
      return sorted.sort((a, b) => firstAvailableKey(b) - firstAvailableKey(a));
    default:
      return sorted.sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0) || b.reviews - a.reviews);
  }
}

export type ActiveFilter = { key: string; value: string; label: string };

/** The removable chips above a grid, in the order the rail lists their groups. */
export function activeFilters(raw: RawSearchParams): ActiveFilter[] {
  const refine = values(raw, "refine")[0];

  return [
    ...(refine ? [{ key: "refine", value: refine, label: refine }] : []),
    ...values(raw, "brand").map((v) => ({ key: "brand", value: v, label: v })),
    ...values(raw, "form").map((v) => ({ key: "form", value: v, label: v })),
    ...values(raw, "price").map((v) => ({
      key: "price",
      value: v,
      label: PRICE_BUCKETS.find((b) => b.id === v)?.label ?? v,
    })),
    ...values(raw, "rating").map((v) => ({ key: "rating", value: v, label: `${v}+ rating` })),
    ...(values(raw, "sale").includes("1") ? [{ key: "sale", value: "1", label: "On offer" }] : []),
    ...(values(raw, "stock").includes("1") ? [{ key: "stock", value: "1", label: "In stock only" }] : []),
  ];
}
