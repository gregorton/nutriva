import "server-only";

import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  GOALS,
  brandsIn,
  byCategory,
  categoryCount,
  hasTermPrefix,
  normalise,
  products,
  search,
  formsIn,
  type CategorySlug,
  type Product,
} from "./catalog";
import { setHref } from "./query";
import { groupLabels, inSubcategory } from "./subcategories";

/*
  What the search field offers while you type.

  Built the way `lib/subcategories.ts` builds its browse rail: declare a vocabulary, then publish
  only the entries the stock actually holds. Nothing is suggested that lands on an empty page — a
  suggestion is a promise about the catalogue, and one that returns nothing is a broken promise.

  There is no hand-written keyword list here. Every term comes from something the repo already
  declares — the category chips, the browse rail's group labels, the brands and the dosage forms —
  so the vocabulary cannot drift away from the catalogue it describes.

  The whole thing is built once at module load (~25ms for 470 products and 300-odd candidate terms)
  and costs nothing per request. Server-only: it reads `lib/catalog.ts`, whose generated JSON is
  1.9MB, so it must never reach a client bundle.
*/

/** A row in the panel: something to press, with how many products it leads to. */
export type SuggestRow = {
  label: string;
  href: string;
  count: number;
  /** Second line, where there is one — a goal's framing or a category's blurb. */
  note: string | null;
};

/** A product row, trimmed to what a thumbnail-and-price line needs. */
export type SuggestProduct = {
  slug: string;
  title: string;
  brand: string;
  image: string;
  price: number;
  listPrice: number | null;
  discount: number | null;
  inStock: boolean;
  rating: number;
  reviews: number;
};

export type Suggestions = {
  query: string;
  /** Categories and goals — both land on a listing page. */
  categories: SuggestRow[];
  /** Counted refinements from the vocabulary. */
  terms: SuggestRow[];
  products: SuggestProduct[];
  /** Every match, not just the ones shown, for the "See all N results" row. */
  total: number;
  /** Set only when the query itself matched nothing. */
  didYouMean: SuggestRow | null;
  /** Offered before anything is typed. */
  popular: SuggestRow[];
};

type Entry = SuggestRow & { normalised: string };

const MAX_TERMS = 6;
const MAX_CATEGORIES = 4;
const MAX_PRODUCTS = 6;
const MAX_POPULAR = 6;

/** Levenshtein switches from "one typo" to "two" here — `zink` may not become `pink`, but
 *  `probiotc` has to be allowed to become `probiotics`. */
const SHORT_WORD = 5;

/*
  The vocabulary. Refinements are counted against the destination they link to rather than against
  `search()`, so the number on the row is the number of products on the page it opens.
*/
function buildVocabulary(): Entry[] {
  const seen = new Set<string>();
  const entries: Entry[] = [];

  const add = (label: string, href: string, count: number) => {
    const normalised = normalise(label);
    if (!normalised || count === 0 || seen.has(normalised)) return;
    seen.add(normalised);
    entries.push({ label, href, count, note: null, normalised });
  };

  // Chips declared on each category, plus the browse rail's own group labels. `inSubcategory` is
  // the same predicate the listing page filters on, and it accepts any string as a `refine` value,
  // so a chip with no matching tile still lands on a filtered page rather than an empty one.
  const refinements = [
    ...CATEGORIES.flatMap((category) => category.chips.map((label) => ({ slug: category.slug, label }))),
    ...groupLabels(),
  ];
  for (const { slug, label } of refinements) {
    const count = byCategory(slug).filter((product) => inSubcategory(product, slug, label)).length;
    add(label, setHref(`/c/${slug}`, {}, "refine", label), count);
  }

  // Brands and dosage forms have no listing page of their own, so they go to the results page —
  // counted by the same `search()` that will answer there.
  for (const { name } of brandsIn(products)) add(name, resultsHref(name), search(name).length);
  for (const { name } of formsIn(products)) add(name, resultsHref(name), search(name).length);

  return entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function resultsHref(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}

const VOCABULARY: Entry[] = buildVocabulary();

/** Category and goal rows. Goals come second: a goal is a way into a category, not a rival to it. */
export function matchCategories(query: string, limit = MAX_CATEGORIES): SuggestRow[] {
  const phrase = normalise(query);
  if (!phrase) return [];
  const terms = phrase.split(" ");
  const matches = (haystack: string) => terms.every((term) => hasTermPrefix(normalise(haystack), term));

  const rows: SuggestRow[] = [];
  for (const category of CATEGORIES) {
    if (!matches(`${category.name} ${category.slug}`)) continue;
    rows.push({
      label: category.name,
      href: `/c/${category.slug}`,
      count: categoryCount(category.slug),
      note: category.blurb,
    });
  }
  for (const goal of GOALS) {
    if (!matches(goal.label)) continue;
    if (rows.some((row) => row.href === `/c/${goal.category}`)) continue;
    rows.push({
      label: goal.label,
      href: `/c/${goal.category}`,
      count: categoryCount(goal.category),
      note: goal.note,
    });
  }
  return rows.slice(0, limit);
}

/** Counted refinements. A term whose whole phrase opens the label sorts above a term that merely
 *  contains it, so `mag` offers *Magnesium* before *Magnesium glycinate*. */
export function matchTerms(query: string, limit = MAX_TERMS): SuggestRow[] {
  const phrase = normalise(query);
  if (!phrase) return [];
  const terms = phrase.split(" ");
  return VOCABULARY.filter((entry) => terms.every((term) => hasTermPrefix(entry.normalised, term)))
    .sort(
      (a, b) =>
        Number(b.normalised.startsWith(phrase)) - Number(a.normalised.startsWith(phrase)) ||
        b.count - a.count ||
        a.label.localeCompare(b.label),
    )
    .slice(0, limit)
    .map(({ label, href, count, note }) => ({ label, href, count, note }));
}

/** Two-row Levenshtein — the whole vocabulary is short strings, so nothing cleverer earns its keep. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/** Fold one trailing plural `s`, so a typo is measured against the word rather than its inflection:
 *  `probiotc` is one edit from *Probiotic* and two from *Probiotics*, and without this the kids'
 *  tile would beat the gut shelf that actually holds the stock. */
function stem(word: string): string {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

/**
 * The nearest vocabulary entry to a query that found nothing. Consulted only on a miss, which is
 * what makes a scan over the whole vocabulary affordable: `zink` -> Zinc, `magnesim` -> Magnesium,
 * `probiotc` -> Probiotics. One typo is allowed in a short word and two in a longer one, because
 * `probiotc` is two edits from `probiotics` while one edit from `zink` reaches half the alphabet.
 *
 * Ties are broken on the first letter and then on stock. `zink` is one edit from both *Zinc* and
 * *Pink*; people mistype the middle of a word, not its opening, so the shared `z` decides it.
 */
export function didYouMean(query: string): SuggestRow | null {
  const phrase = stem(normalise(query));
  if (!phrase) return null;
  const allowed = phrase.length <= SHORT_WORD ? 1 : 2;

  let best: { entry: Entry; edits: number; initial: boolean } | null = null;
  for (const entry of VOCABULARY) {
    // A multi-word label is compared whole and word by word, so `glycinat` reaches
    // "Magnesium glycinate" without having to spell the first word too.
    const candidates = entry.normalised.includes(" ")
      ? [entry.normalised, ...entry.normalised.split(" ")]
      : [entry.normalised];
    for (const raw of candidates) {
      const candidate = stem(raw);
      if (Math.abs(candidate.length - phrase.length) > allowed) continue;
      const edits = distance(phrase, candidate);
      if (edits > allowed) continue;
      const initial = candidate[0] === phrase[0];
      const beatsBest =
        !best ||
        edits < best.edits ||
        (edits === best.edits &&
          ((initial && !best.initial) || (initial === best.initial && entry.count > best.entry.count)));
      if (beatsBest) best = { entry, edits, initial };
    }
  }
  if (!best) return null;
  const { label, href, count, note } = best.entry;
  return { label, href, count, note };
}

/*
  What the panel offers before a keystroke. A fixed shortlist, resolved against the vocabulary so
  each row carries a real count and a real destination, and dropped if the stock no longer holds it.
*/
const POPULAR = [
  "Vitamin D3",
  "Magnesium",
  "Omega-3",
  "Probiotics",
  "Collagen",
  "Whey protein",
  "Zinc",
  "Melatonin",
];

export function popularSearches(limit = MAX_POPULAR): SuggestRow[] {
  const rows: SuggestRow[] = [];
  for (const label of POPULAR) {
    if (rows.length >= limit) break;
    const known = VOCABULARY.find((entry) => entry.normalised === normalise(label));
    if (known) {
      rows.push({ label: known.label, href: known.href, count: known.count, note: null });
      continue;
    }
    const count = search(label).length;
    if (count > 0) rows.push({ label, href: resultsHref(label), count, note: null });
  }
  return rows;
}

function toRow(product: Product): SuggestProduct {
  return {
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    image: product.image,
    price: product.price,
    listPrice: product.listPrice,
    discount: product.discount,
    inStock: product.inStock,
    rating: product.rating,
    reviews: product.reviews,
  };
}

/**
 * Everything the dropdown needs for one query, in one pass. The route handler is a wrapper over
 * this, and `app/search/page.tsx` reads `didYouMean` from the same module — so a suggestion and a
 * results page can never disagree, because both run the same `search()`.
 */
export function suggest(query: string): Suggestions {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: "",
      categories: [],
      terms: [],
      products: [],
      total: 0,
      didYouMean: null,
      popular: popularSearches(),
    };
  }

  const results = search(trimmed);
  return {
    query: trimmed,
    categories: matchCategories(trimmed),
    terms: matchTerms(trimmed),
    products: results.slice(0, MAX_PRODUCTS).map(toRow),
    total: results.length,
    didYouMean: results.length === 0 ? didYouMean(trimmed) : null,
    popular: [],
  };
}

/** Category display names, for the panel's "in Vitamins" line. Cheap re-export so the client
 *  island never has to reach into `lib/catalog.ts`. */
export function categoryName(slug: CategorySlug): string {
  return CATEGORY_BY_SLUG.get(slug)?.name ?? slug;
}
