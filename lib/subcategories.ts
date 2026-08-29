import { byCategory, formsIn, type CategorySlug, type Product } from "./catalog";

/*
  Subcategory types for the listing-page browse rail.

  A category page opens on one taxonomy node ("Vitamins") holding a few dozen products that are
  really several different things — D3 alone, D3 with K2, gummies, kids' drops. The rail at the top
  of `/c/[slug]` splits that pool into the types a shopper would name, each shown with the photo of
  its best-selling product.

  The split is defined here as label + match terms, but never asserted: a group is only shown when
  the harvested catalogue actually holds products whose title matches, so the rail describes the
  stock rather than the taxonomy. Where a category's terms find too few groups to browse, the rail
  tops up with dosage forms read off the same products (Softgels, Gummies, Powder…), which are also
  a real distinction a shopper picks on.
*/

type Group = { label: string; terms: string[] };

/** Fewest tiles worth showing as a rail — below this, form tiles top the rail up. */
const MIN_TILES = 6;
const MAX_TILES = 10;
/** A type with a single product is a product, not a type worth its own tile. */
const MIN_PRODUCTS = 2;

const GROUPS: Record<CategorySlug, Group[]> = {
  vitamins: [
    { label: "Vitamin D3", terms: ["vitamin d3", "vitamin d-3", "vitamins d3", "vitamin d "] },
    {
      label: "Vitamin D3 & K2",
      terms: ["d3 + k2", "d3 & k2", "d3+k2", "k2 + d3", "k2 + vitamin d3", "d3 & mk-7", "k2d3", "d3 with vitamin k2", "d + k2"],
    },
    { label: "Vitamin K2", terms: ["k2", "mk-7"] },
    { label: "Vitamin C", terms: ["vitamin c", "c complex", "ascorbic"] },
    { label: "Vitamin B", terms: ["b-12", "b12", "b-complex", "b complex"] },
    { label: "Multivitamins", terms: ["multivitamin", "multi vitamin"] },
    { label: "Folate", terms: ["folate", "folinic"] },
    { label: "Gummies", terms: ["gummies", "gummy"] },
    { label: "Drops & liquids", terms: ["fl oz", "drops", " ml)"] },
    { label: "Kids", terms: ["kids", "children"] },
  ],
  minerals: [
    { label: "Magnesium", terms: ["magnesium"] },
    { label: "Zinc", terms: ["zinc"] },
    { label: "Calcium", terms: ["calcium"] },
    { label: "Iron", terms: ["iron"] },
    { label: "Selenium", terms: ["selenium"] },
    { label: "Trace minerals", terms: ["trace mineral", "multi mineral", "multimineral"] },
    { label: "Glycinate", terms: ["glycinate"] },
    { label: "Citrate", terms: ["citrate"] },
    { label: "Gummies", terms: ["gummies", "gummy"] },
  ],
  omega: [
    { label: "Fish oil", terms: ["fish oil", "omega-3", "omega 3"] },
    { label: "High EPA", terms: ["epa"] },
    { label: "DHA", terms: ["dha"] },
    { label: "Krill oil", terms: ["krill"] },
    { label: "Algae omega", terms: ["algae", "algal", "vegan omega"] },
    { label: "Cod liver", terms: ["cod liver"] },
    { label: "Triple strength", terms: ["triple", "ultra", "extra strength"] },
    { label: "Kids", terms: ["kids", "children"] },
  ],
  gut: [
    { label: "Probiotics", terms: ["probiotic"] },
    { label: "50B+ CFU", terms: ["50 billion", "60 billion", "65 billion", "70 billion", "100 billion", "105 billion"] },
    { label: "Women's", terms: ["women", "lactation", "menopause"] },
    { label: "Delayed release", terms: ["delayed release"] },
    { label: "CoQ10", terms: ["coq10", "ubiquinol"] },
    { label: "Fibre", terms: ["glucomannan", "fiber", "fibre", "psyllium"] },
    { label: "Kids", terms: ["kids", "children"] },
  ],
  sleep: [
    { label: "Melatonin", terms: ["melatonin"] },
    { label: "Gummies", terms: ["gummies", "gummy"] },
    { label: "Magnesium", terms: ["magnesium"] },
    { label: "Ashwagandha", terms: ["ashwagandha", "ksm-66", "sensoril"] },
    { label: "L-theanine", terms: ["theanine"] },
    { label: "Valerian", terms: ["valerian"] },
    { label: "Fast dissolve", terms: ["fast dissolve", "dissolve", "sublingual", "lozenge"] },
    { label: "Kids", terms: ["kids", "children"] },
  ],
  immunity: [
    { label: "Vitamin C", terms: ["vitamin c", "ester-c", "c formula", "acerola", "ultra c", "liposomal vitamin c"] },
    { label: "Immune support", terms: ["immune"] },
    { label: "Zinc", terms: ["zinc"] },
    { label: "Gummies", terms: ["gummies", "gummy"] },
    { label: "Elderberry", terms: ["elderberry"] },
    { label: "Bioflavonoids", terms: ["bioflavonoid", "rose hip", "rose hips"] },
    { label: "Effervescent", terms: ["effervescent"] },
    { label: "Chewables", terms: ["chewable"] },
    { label: "Kids", terms: ["kids", "kidz", "junior"] },
  ],
  herbs: [
    { label: "Turmeric", terms: ["turmeric", "curcumin"] },
    { label: "With BioPerine", terms: ["bioperine", "black pepper"] },
    { label: "Organic", terms: ["organic"] },
    { label: "Superfoods", terms: ["superfood"] },
    { label: "Mushrooms", terms: ["mushroom", "reishi", "cordyceps", "lion's mane", "maitake"] },
    { label: "Spirulina", terms: ["spirulina", "chlorella"] },
    { label: "Ginseng", terms: ["ginseng"] },
    { label: "Antioxidants", terms: ["astaxanthin", "lutein", "alpha-lipoic", "glutathione"] },
    { label: "Gummies", terms: ["gummies", "gummy"] },
  ],
  sports: [
    { label: "Whey protein", terms: ["whey"] },
    { label: "Isolate", terms: ["isolate"] },
    { label: "Plant protein", terms: ["plant-based protein", "pea protein", "plant protein", "vegan protein", "rice protein"] },
    { label: "Amino acids", terms: ["bcaa", "amino", "glutamine", "leucine"] },
    { label: "Creatine", terms: ["creatine"] },
    { label: "Electrolytes", terms: ["electrolyte", "hydration"] },
    { label: "Unflavored", terms: ["unflavored"] },
    { label: "Chocolate", terms: ["chocolate", "cocoa"] },
    { label: "Vanilla", terms: ["vanilla"] },
  ],
  beauty: [
    { label: "Collagen", terms: ["collagen"] },
    { label: "Marine collagen", terms: ["marine collagen"] },
    { label: "Multi collagen", terms: ["multi collagen", "multi-collagen"] },
    { label: "Biotin", terms: ["biotin"] },
    { label: "Hyaluronic acid", terms: ["hyaluronic"] },
    { label: "Serums & oils", terms: ["serum", "facial oil", "lip oil"] },
    { label: "Masks", terms: ["mask"] },
    { label: "Creams", terms: ["cream", "moistur"] },
    { label: "Hair", terms: ["shampoo", "hair"] },
  ],
  kids: [
    { label: "Kids multi", terms: ["multivitamin", "multi vitamin", "multi-vitamin", "multi gummies"] },
    { label: "Gummies", terms: ["gummies", "gummy"] },
    { label: "Chewables", terms: ["chewable"] },
    { label: "Vitamin C", terms: ["vitamin c", "gold c"] },
    { label: "Vitamin D", terms: ["vitamin d", "d3"] },
    { label: "Probiotic", terms: ["probiotic"] },
    { label: "Sleep", terms: ["sleep", "melatonin"] },
    { label: "Prenatal", terms: ["prenatal", "lactation"] },
    { label: "Bath & body", terms: ["shampoo", "body wash", "balm"] },
  ],
};

/**
 * Every defined group label, paired with the category that defines it. The search vocabulary in
 * `lib/search-suggest.ts` counts these against the stock the same way the rail does, so a
 * suggestion and a tile can never disagree about whether a type exists. Labels only — the match
 * terms stay private to the rail.
 */
export function groupLabels(): { slug: CategorySlug; label: string }[] {
  return Object.entries(GROUPS).flatMap(([slug, groups]) =>
    groups.map((group) => ({ slug: slug as CategorySlug, label: group.label })),
  );
}

export type Subcategory = {
  label: string;
  /** How many products in the category match — printed under the tile. */
  count: number;
  /** Best-selling match, whose photo the tile shows. */
  lead: Product;
};

function haystack(product: Product): string {
  return `${product.brand} ${product.title} ${product.form ?? ""}`.toLowerCase();
}

function matches(product: Product, terms: string[]): boolean {
  const text = haystack(product);
  return terms.some((term) => text.includes(term));
}

/**
 * Terms for a subcategory label, so the listing page can filter on the same match the tile
 * counted. Returns null for a label this category does not define, which lets the `refine`
 * parameter keep its plain substring behaviour for anything else.
 */
export function subcategoryTerms(slug: CategorySlug, label: string): string[] | null {
  const wanted = label.trim().toLowerCase();
  const group = GROUPS[slug]?.find((g) => g.label.toLowerCase() === wanted);
  if (group) return group.terms;
  // Form tiles carry their own label as the term ("Softgels" -> "softgels").
  const form = formsIn(byCategory(slug)).find((f) => f.name.toLowerCase() === wanted);
  return form ? [form.name.toLowerCase()] : null;
}

/** True when a product belongs to `label`, by the same rule the tile counted it. */
export function inSubcategory(product: Product, slug: CategorySlug, label: string): boolean {
  const terms = subcategoryTerms(slug, label);
  return terms ? matches(product, terms) : haystack(product).includes(label.toLowerCase());
}

/**
 * The browse tiles for a category: defined groups that the stock actually supports, biggest
 * first, topped up with dosage forms when the groups alone are too few to browse.
 */
export function subcategoriesIn(slug: CategorySlug): Subcategory[] {
  const pool = byCategory(slug);
  if (pool.length === 0) return [];

  const bestSelling = [...pool].sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0) || b.reviews - a.reviews);

  const build = (label: string, terms: string[]): Subcategory | null => {
    const hits = bestSelling.filter((p) => matches(p, terms));
    if (hits.length < MIN_PRODUCTS) return null;
    return { label, count: hits.length, lead: hits[0] };
  };

  const tiles: Subcategory[] = [];
  for (const group of GROUPS[slug] ?? []) {
    const tile = build(group.label, group.terms);
    if (tile) tiles.push(tile);
  }

  if (tiles.length < MIN_TILES) {
    const taken = new Set(tiles.map((t) => t.label.toLowerCase()));
    for (const form of formsIn(pool)) {
      if (tiles.length >= MIN_TILES) break;
      if (taken.has(form.name.toLowerCase())) continue;
      const tile = build(form.name, [form.name.toLowerCase()]);
      if (tile) tiles.push(tile);
    }
  }

  // A rail of identical bottles reads as one product repeated, so give each tile the
  // best-selling match whose photo no earlier tile already used.
  const usedImages = new Set<string>();
  const ordered = tiles.sort((a, b) => b.count - a.count).slice(0, MAX_TILES);
  return ordered.map((tile) => {
    if (!usedImages.has(tile.lead.image)) {
      usedImages.add(tile.lead.image);
      return tile;
    }
    const terms = subcategoryTerms(slug, tile.label) ?? [];
    const fresh = bestSelling.find((p) => matches(p, terms) && !usedImages.has(p.image));
    const lead = fresh ?? tile.lead;
    usedImages.add(lead.image);
    return { ...tile, lead };
  });
}
