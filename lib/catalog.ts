import raw from "./catalog.generated.json";
import { adjust } from "./fx";

/*
  Catalog data layer — the single boundary between the storefront and its product data.

  The data is harvested from th.iherb.com by the three-stage pipeline in `reference/iherb/`
  (discover -> harvest -> build): real titles, prices in THB, ratings, review counts, label
  copy, supplement-facts tables and product photography. Nothing in this file invents a value.
  Everything is either read straight from the harvest or computed from two harvested numbers
  (per-serving cost from price and servings, discount from price and list price).

  Price is the one field that does not arrive finished. The harvest recorded what iHerb charged on
  the day it ran, at that day's exchange rate, so `lib/fx.ts` restates it at today's rate and
  rounds up to the whole baht. That happens once, in the mapper below, which is why the rest of
  the storefront — filter bands, sorting, kit totals, the free-delivery threshold — can go on
  treating `price` as a plain THB number, and why every figure `price()` formats ends in `.00`.

  A field iHerb does not state comes through as null or an empty array, and the component that
  would have shown it renders nothing. That rule is what keeps the page honest: no guessed
  %DV, no guessed certifications, no guessed best-by dates.
*/

export type CategorySlug =
  | "vitamins"
  | "minerals"
  | "omega"
  | "gut"
  | "sleep"
  | "immunity"
  | "herbs"
  | "sports"
  | "beauty"
  | "kids";

/** One row of a supplement-facts panel, as printed on the label. */
export type FactsRow = { name: string; amount: string; dailyValue: string | null };

export type SupplementFacts = {
  servingSize: string | null;
  servingsPerContainer: string | null;
  rows: FactsRow[];
  footnotes: string[];
};

export type Product = {
  slug: string;
  brand: string;
  /** Full title as the label reads it, brand included. */
  name: string;
  /** Title with the brand prefix removed — what cards and headings print. */
  title: string;
  category: CategorySlug;
  /** The page this product's data came from. */
  source: string;
  image: string;
  /** Main shot first, then alternate views. */
  images: string[];

  price: number;
  listPrice: number | null;
  /** Percent off, present only when listPrice is set. */
  discount: number | null;
  inStock: boolean;
  sold30d: number | null;
  rating: number;
  reviews: number;

  // ---- label data ----
  /** Manufacturer part number, e.g. NOW-01289. */
  productCode: string | null;
  upc: string | null;
  /** The pack as the label sizes it: "180 count", "16 oz (454 g)". */
  packQuantity: string | null;
  /** Units in the pack — 180 of "180 Tablets". */
  units: number | null;
  /** Dosage form: Tablets, Veggie Capsules, Gummies. */
  form: string | null;
  /** What one serving is: "2 tablets", "1 scoop (31 g)". */
  servingSize: string | null;
  /** Servings per container — not the same as `units` when a serving is two tablets. */
  servings: number | null;
  perServing: number | null;
  /** Amount of the single labelled active, where there is exactly one. */
  dose: string | null;
  shippingWeight: string | null;
  dimensions: string | null;
  /** MM/YYYY the product first shipped. */
  firstAvailable: string | null;
  /** MM/YYYY on the batch currently held. */
  bestBy: string | null;

  certifications: string[];
  qualityStandards: string[];

  // ---- label copy ----
  /** Front-of-pack claim lines. */
  highlights: string[];
  overview: string[];
  suggestedUse: string[];
  otherIngredients: string[];
  warnings: string[];
  storage: string[];
  supplementFacts: SupplementFacts | null;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  /** shown under the category heading on a listing page */
  blurb: string;
  /** groups shown as subcategory chips on the listing page */
  chips: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "vitamins",
    name: "Vitamins",
    blurb: "Vitamin D3, much of it paired with K2, plus B vitamins, C and folate.",
    chips: ["Vitamin D", "Vitamin C", "B-complex", "Multivitamins", "Vitamin K2", "Folate"],
  },
  {
    slug: "minerals",
    name: "Minerals",
    blurb: "Mostly magnesium, in chelated and glycinate forms.",
    chips: ["Magnesium", "Zinc", "Iron", "Calcium", "Selenium", "Trace minerals"],
  },
  {
    slug: "omega",
    name: "Omega & fish oil",
    blurb: "EPA and DHA from fish oil, in softgels.",
    chips: ["Fish oil", "Krill oil", "Algae omega", "Cod liver", "High EPA", "High DHA"],
  },
  {
    slug: "gut",
    name: "Gut & digestion",
    blurb: "Live cultures, counted in CFU per capsule.",
    chips: ["Probiotics", "Prebiotic fibre", "Enzymes", "Shelf-stable", "50B+ CFU", "Kids"],
  },
  {
    slug: "sleep",
    name: "Sleep & stress",
    blurb: "Melatonin, and a few wind-down formulas without it.",
    chips: ["Melatonin", "Magnesium", "Ashwagandha", "L-theanine", "Valerian", "Non-habit"],
  },
  {
    slug: "immunity",
    name: "Immunity",
    blurb: "Vitamin C and zinc, in capsules and gummies.",
    chips: ["Vitamin C", "Zinc", "Elderberry", "Quercetin", "Mushrooms", "Echinacea"],
  },
  {
    slug: "herbs",
    name: "Herbs",
    blurb: "Turmeric and curcumin extracts, with the actives stated.",
    chips: ["Turmeric", "Ginseng", "Ginkgo", "Milk thistle", "Berberine", "Ashwagandha"],
  },
  {
    slug: "sports",
    name: "Sport & protein",
    blurb: "Whey protein powders, concentrate and isolate.",
    chips: ["Whey protein", "Plant protein", "Creatine", "Electrolytes", "Amino acids", "Recovery"],
  },
  {
    slug: "beauty",
    name: "Skin, hair & nails",
    blurb: "Hydrolysed collagen peptides, mostly unflavoured.",
    chips: ["Collagen", "Biotin", "Hyaluronic acid", "Vitamin C serum", "Hair", "Nails"],
  },
  {
    slug: "kids",
    name: "Kids & family",
    blurb: "Multivitamin gummies sized for children.",
    chips: ["Kids multi", "Kids omega", "Kids probiotic", "Gummies", "Drops", "Prenatal"],
  },
];

export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

/**
 * Condition-led entry points. Supplement shoppers arrive with a goal ("sleep better"),
 * not a taxonomy node, so these sit alongside the category nav rather than under it.
 */
export const GOALS: { slug: string; label: string; category: CategorySlug; note: string }[] = [
  { slug: "sleep-better", label: "Sleep better", category: "sleep", note: "Melatonin, and formulas without it" },
  { slug: "everyday-immunity", label: "Everyday immunity", category: "immunity", note: "Vitamin C and zinc" },
  { slug: "train-recover", label: "Train & recover", category: "sports", note: "Whey protein powders" },
  { slug: "gut-reset", label: "Gut reset", category: "gut", note: "Live cultures" },
  { slug: "skin-hair", label: "Skin & hair", category: "beauty", note: "Collagen peptides and biotin" },
  { slug: "energy-focus", label: "Energy & focus", category: "vitamins", note: "B vitamins and vitamin D3" },
];

/** Stable hash, for the one ordering the data cannot supply (see `newArrivals`). */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = ((h ^ input.charCodeAt(i)) * 16777619) >>> 0;
  return h;
}

/*
  The generated file carries a few fields the storefront doesn't read: the source product id, the
  discount badge as iHerb worded it, iHerb's own category rankings, and its pack tiles. They stay
  in the JSON as provenance. Declaring them here rather than casting through `unknown` means the
  cast is checked: if `reference/iherb/build.mjs` stops emitting a field the UI needs, this line
  fails to compile instead of failing at runtime.
*/
type RawItem = Omit<Product, "discount" | "category"> & {
  category: string;
  pid: string;
  discountLabel: string | null;
  rankings: { rank: string; category: string }[];
  packVariants: { label: string; pid: string; price: number | null; outOfStock: boolean }[];
};

export const products: Product[] = (raw.items as RawItem[]).map((item) => {
  // The harvest froze these at the exchange rate of the day it ran; `adjust` restates them at
  // today's, and does it here so every filter band, sort, kit total and threshold downstream still
  // sees one consistent set of THB figures. Discount is recomputed from the restated pair, or a
  // ฿1 rounding on each side would drift the percentage off what the two prices actually show.
  const price = adjust(item.price);
  const listPrice = item.listPrice === null ? null : adjust(item.listPrice);

  return {
    ...item,
    category: item.category as CategorySlug,
    price,
    listPrice,
    discount: listPrice ? Math.round(((listPrice - price) / listPrice) * 100) : null,
  };
});

export const productBySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return productBySlug.get(slug);
}

export function byCategory(slug: CategorySlug): Product[] {
  return products.filter((p) => p.category === slug);
}

export function categoryCount(slug: CategorySlug): number {
  return byCategory(slug).length;
}

/** Highest 30-day volume first, then review count — both figures come from the source listing. */
export function bestSellers(limit = 12, category?: CategorySlug): Product[] {
  return [...(category ? byCategory(category) : products)]
    .sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0) || b.reviews - a.reviews)
    .slice(0, limit);
}

/**
 * Marked-down stock, deepest discount first, but spread so one brand's sale cannot fill the rail.
 * The specials pages a markdown comes from tend to be brand-wide, so a straight sort by discount
 * returns five of the same label — true, and useless as a shop front. Round-robin by brand keeps
 * the ordering honest (still deepest-first within each brand) and the rail readable.
 */
export function deals(limit = 12): Product[] {
  const byBrand = new Map<string, Product[]>();
  for (const product of products.filter((p) => p.discount).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))) {
    if (!byBrand.has(product.brand)) byBrand.set(product.brand, []);
    byBrand.get(product.brand)!.push(product);
  }
  const lists = [...byBrand.values()];
  const out: Product[] = [];
  for (let round = 0; out.length < limit; round++) {
    const before = out.length;
    for (const list of lists) {
      if (round < list.length) out.push(list[round]);
      if (out.length >= limit) break;
    }
    if (out.length === before) break; // every list exhausted
  }
  return out;
}

/** How many products carry a markdown at all — the figure the "all N deals" link needs. */
export function dealCount(): number {
  return products.filter((p) => p.discount).length;
}

/** MM/YYYY -> sortable YYYYMM. Products with no stated date sort last. */
function firstAvailableKey(product: Product): number {
  const match = product.firstAvailable?.match(/(\d{1,2})\/(\d{4})/);
  return match ? Number(match[2]) * 100 + Number(match[1]) : 0;
}

/** Newest first by the date the label says it first shipped. */
export function newArrivals(limit = 12): Product[] {
  return [...products]
    .sort((a, b) => firstAvailableKey(b) - firstAvailableKey(a) || hash(a.slug) - hash(b.slug))
    .slice(0, limit);
}

export function topRated(limit = 12): Product[] {
  return [...products].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, limit);
}

/** Same category first, then anything sharing the brand. */
export function related(product: Product, limit = 6): Product[] {
  const sameCategory = byCategory(product.category).filter((p) => p.slug !== product.slug);
  const sameBrand = products.filter((p) => p.brand === product.brand && p.slug !== product.slug);
  const seen = new Set<string>();
  return [...sameCategory, ...sameBrand]
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .slice(0, limit);
}

/*
  Search. Two rules do the work, and both replace a bare `includes` test that used to be here.

  A term matches on a **word prefix**, not a substring. `vitamin d` used to return 172 of the 470
  products, second among them a marine collagen powder, because `d` is a substring of `Hydrolyzed`.
  As a word prefix it matches `D3` and never the inside of another word. The same rule is what lets
  `vit d` find vitamin D with no synonym table behind it.

  And **where** a term matched decides the order. Every term still has to match somewhere, but a hit
  in the title outranks one in the brand, which outranks the category, which outranks the label
  fields; volume only breaks ties between equally relevant products. Ordering used to be volume
  alone, so a bestseller whose highlight bullets happened to mention collagen outranked an actual
  collagen product.
*/

/**
 * Lowercase, fold hyphens and slashes to spaces, drop the rest of the punctuation. `D-3` and `D3`,
 * `B-complex` and `B complex`, `Zinc-L-Carnosine` and `zinc l carnosine` all come out as something
 * a typed query can be compared against directly. Exported because the suggestion vocabulary in
 * `lib/search-suggest.ts` has to be normalised the same way or its counts disagree with `search`.
 */
export function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9%+&./ -]+/g, " ")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Does `term` start a word in `haystack`? Both must already be through `normalise`. */
export function hasTermPrefix(haystack: string, term: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(term, from);
    if (at < 0) return false;
    if (at === 0 || !/[a-z0-9]/.test(haystack[at - 1])) return true;
    from = at + 1;
  }
}

/** Weight of the best field a term matched in. Only the best one counts, per term. */
const TITLE_WEIGHT = 10;
const BRAND_WEIGHT = 7;
const CATEGORY_WEIGHT = 5;
const LABEL_WEIGHT = 2;
/** Bonuses, applied once per product rather than per term. */
const PHRASE_IN_TITLE = 8;
const TITLE_OPENS_WITH_PHRASE = 6;
const IN_STOCK_BONUS = 1;
/** Under this length, a term may only match the title, brand or category — a stray `d` in a
 *  highlight bullet is noise, and matching it there is what inflated `vitamin d` to 172 rows. */
const SHORT_TERM = 3;

type SearchFields = { title: string; brand: string; category: string; label: string };

/*
  Normalised once at module load rather than per query: 470 products come to about 3ms here and
  nothing per request, where normalising inside the loop would redo the same work on every
  keystroke of the suggestion endpoint.
*/
const searchFields: SearchFields[] = products.map((product) => ({
  title: normalise(product.title),
  brand: normalise(product.brand),
  category: normalise(`${product.category} ${CATEGORY_BY_SLUG.get(product.category)?.name ?? ""}`),
  label: normalise(
    [product.form, product.dose, product.packQuantity, ...product.highlights].filter(Boolean).join(" "),
  ),
}));

export function search(query: string): Product[] {
  const phrase = normalise(query);
  if (!phrase) return [];
  const terms = phrase.split(" ");
  const scored: { product: Product; score: number }[] = [];

  for (let index = 0; index < products.length; index++) {
    const fields = searchFields[index];
    let score = 0;
    let everyTermMatched = true;

    for (const term of terms) {
      let best = 0;
      if (hasTermPrefix(fields.title, term)) best = TITLE_WEIGHT;
      else if (hasTermPrefix(fields.brand, term)) best = BRAND_WEIGHT;
      else if (hasTermPrefix(fields.category, term)) best = CATEGORY_WEIGHT;
      else if (term.length >= SHORT_TERM && hasTermPrefix(fields.label, term)) best = LABEL_WEIGHT;

      if (!best) {
        everyTermMatched = false;
        break;
      }
      score += best;
    }
    if (!everyTermMatched) continue;

    if (fields.title.includes(phrase)) score += PHRASE_IN_TITLE;
    if (fields.title.startsWith(phrase)) score += TITLE_OPENS_WITH_PHRASE;
    if (products[index].inStock) score += IN_STOCK_BONUS;

    scored.push({ product: products[index], score });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.product.sold30d ?? 0) - (a.product.sold30d ?? 0) ||
        b.product.reviews - a.product.reviews,
    )
    .map(({ product }) => product);
}

/** The normalised fields `search` scores against, for a caller that needs to count matches
 *  without paying for a full sort — the suggestion vocabulary counts 300-odd terms this way. */
export function searchHaystack(index: number): SearchFields {
  return searchFields[index];
}

export function brandsIn(items: Product[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of items) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function formsIn(items: Product[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of items) {
    if (!p.form) continue;
    const normalised = p.form.replace(/^(Veggie|Veg|Vegetarian|Vegan|Vegetable|Plant-Based|Liquid|Soft|Fish|Enteric) /i, "");
    counts.set(normalised, (counts.get(normalised) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
