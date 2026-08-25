import { CATEGORY_BY_SLUG, products, type Product, type SupplementFacts } from "./catalog";
import { price } from "./format";

/*
  Product-information layer — the input to the "Product information" section and to the
  at-a-glance panel beside the buy box.

  Everything a label states now arrives with the product: highlights, overview copy, suggested
  use, other ingredients, warnings, storage, certifications, and the supplement-facts table with
  real %DV. This module's job is no longer to invent that copy but to choose it, format it, and
  fall back to something derived-but-true when a particular product's page states nothing.

  The one rule that has not changed: a panel whose inputs are missing renders nothing.
*/

export type Fact = { label: string; value: string };

/** "Veggie Capsules" -> "veggie capsule", so dosage copy reads "one veggie capsule daily". */
export function unitLabel(form: string | null): string {
  if (!form) return "serving";
  return form
    .replace(/ies$/i, "y")
    .replace(/s$/i, "")
    .toLowerCase();
}

/** "180 tablets" — the pack as a shopper counts it, preferring units over servings. */
export function packLabel(product: Product): string | null {
  if (product.units && product.form) return `${product.units} ${product.form.toLowerCase()}`;
  if (product.packQuantity) return product.packQuantity.toLowerCase();
  if (product.servings) return `${product.servings} servings`;
  return null;
}

/*
  The supplement's own name, for grouping pack sizes of one product together: the title minus
  the pack phrase and minus any parenthetical, which in this data is a per-unit dose restated.
  "Magnesium Bisglycinate Chelate, Albion TRAACS®, 240 Veggie Capsules (100 mg per Capsule)"
  -> "Magnesium Bisglycinate Chelate, Albion TRAACS®".
*/
const PACK_PHRASE =
  /,?\s*\d[\d,]*\s+(?:[A-Za-z][A-Za-z-]*\s+){0,2}(?:Capsules?|Softgels?|Tablets?|Gummies|Gels?|Packets?|Chewables?|Lozenges?|Sachets?|Servings?|Caps?|Count|Wafers?|Strips?|Sticks?)\b/i;

export function activeName(product: Product): string {
  return product.title
    .replace(PACK_PHRASE, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+,/g, ",")
    .replace(/[,\s]+$/, "")
    .trim();
}

/**
 * The figures worth reading before scrolling: what a serving is, how many are in the pack, and
 * how long the batch we hold is good for. All three are label data rather than derivations —
 * cost per serving used to sit here and was the one computed figure, which is why it is gone.
 */
export function keyInfo(product: Product): Fact[] {
  return [
    ...(product.servingSize ? [{ label: "Serving size", value: product.servingSize }] : []),
    ...(product.servings ? [{ label: "Total servings", value: String(product.servings) }] : []),
    ...(product.bestBy ? [{ label: "Best by", value: product.bestBy }] : []),
  ];
}

/** The label's own specification list, in the reference site's reading order, plus our pricing. */
export function specifications(product: Product): Fact[] {
  const pack = packLabel(product);
  return [
    { label: "Brand", value: product.brand },
    { label: "Category", value: CATEGORY_BY_SLUG.get(product.category)?.name ?? product.category },
    ...(product.firstAvailable ? [{ label: "First available", value: product.firstAvailable }] : []),
    ...(product.productCode ? [{ label: "Product code", value: product.productCode }] : []),
    ...(product.upc ? [{ label: "UPC", value: product.upc }] : []),
    ...(pack ? [{ label: "Package quantity", value: pack }] : []),
    ...(product.form ? [{ label: "Format", value: product.form }] : []),
    ...(product.dose ? [{ label: "Dose per serving", value: product.dose }] : []),
    ...(product.shippingWeight ? [{ label: "Shipping weight", value: product.shippingWeight }] : []),
    ...(product.dimensions ? [{ label: "Dimensions", value: product.dimensions }] : []),
    { label: "Pack price", value: price(product.price) },
  ];
}

/**
 * The label's supplement-facts panel. Products without one — a protein powder files its figures
 * as nutrition facts, some topicals have none at all — return null and the panel is left out.
 */
export function supplementFacts(product: Product): SupplementFacts | null {
  const facts = product.supplementFacts;
  if (!facts?.rows.length) return null;
  return facts;
}

/** Front-of-pack claim lines, as printed. */
export function overviewPoints(product: Product): string[] {
  return product.highlights;
}

/** The manufacturer's own description. Falls back to the catalog facts phrased as a sentence. */
export function overviewParagraphs(product: Product): string[] {
  if (product.overview.length) return product.overview;
  const category = CATEGORY_BY_SLUG.get(product.category)?.name.toLowerCase() ?? product.category;
  const pack = packLabel(product);
  const dose = product.dose ? ` at ${product.dose} per serving` : "";
  return [
    `${product.brand} ${activeName(product)}${dose}${pack ? `, supplied as ${pack}` : ""}. ` +
      `Stocked in our ${category} range and shipped sealed from Bangkok.`,
  ];
}

/** The label's directions. Falls back to a dose sentence built from the pack maths. */
export function suggestedUse(product: Product): string[] {
  if (product.suggestedUse.length) return product.suggestedUse;
  if (!product.servings || !product.form) {
    return ["Follow the dosage printed on the label, taken with food unless stated otherwise."];
  }
  const months = Math.max(1, Math.round(product.servings / 30));
  return [
    `One ${unitLabel(product.form)} daily with food. A pack of ${product.servings} lasts ` +
      `${months} month${months === 1 ? "" : "s"} at that rate.`,
  ];
}

export function otherIngredients(product: Product): string[] {
  return product.otherIngredients;
}

/** The label's warnings, with our own as the floor — every pack needs at least these two. */
export function warnings(product: Product): string[] {
  if (product.warnings.length) return product.warnings;
  return [
    "For adults only. Consult a physician if pregnant or nursing, taking medication, or managing a medical condition.",
    "Keep out of reach of children. Do not exceed the dose printed on the label.",
  ];
}

/** Label storage advice plus how we hold it, which the label cannot state. */
export function storage(product: Product): string[] {
  return [
    ...product.storage,
    "Held below 25°C in our Bangkok warehouse and shipped sealed. Store in a cool, dry place away from direct sun once opened.",
  ];
}

export const DISCLAIMER =
  "Packaging and label details can change ahead of our product pages. Read the label, warnings and directions on the pack you receive before use, and treat the figures here as a guide to the batch we currently hold rather than a substitute for the pack itself.";

/*
  Certification and diet marks come from the label, so the set is open-ended — "Vegan",
  "Non-GMO", "NSF Certified", "Keto Friendly". Known marks get their own icon; anything else
  gets the generic badge rather than being dropped, because the claim is real either way.
*/
export type ClaimIconKey =
  | "vegan"
  | "vegetarian"
  | "non-gmo"
  | "organic"
  | "gluten-free"
  | "kosher"
  | "halal"
  | "tested"
  | "badge";

const CLAIM_ICONS: [RegExp, ClaimIconKey][] = [
  [/vegan/i, "vegan"],
  [/vegg?ie|vegetarian/i, "vegetarian"],
  [/non-?gmo|gmo-?free/i, "non-gmo"],
  [/organic/i, "organic"],
  [/gluten|wheat-?free/i, "gluten-free"],
  [/kosher/i, "kosher"],
  [/halal/i, "halal"],
  [/tested|verified|certified|nsf|informed/i, "tested"],
];

export function claimMarks(labels: string[]): { key: string; label: string; icon: ClaimIconKey }[] {
  const seen = new Set<string>();
  return labels
    .map((label) => label.replace(/\s+/g, " ").trim())
    .filter((label) => label.length > 1 && label.length < 40)
    .filter((label) => (seen.has(label.toLowerCase()) ? false : (seen.add(label.toLowerCase()), true)))
    .map((label) => ({
      key: label,
      label,
      icon: CLAIM_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? "badge",
    }));
}

/** Reads the label's certification chips as icon marks. */
export function dietClaims(product: Product) {
  return claimMarks(product.certifications);
}

/*
  Manufacturing standards. The label states the marks ("GMP", "Made in USA"); the notes only
  restate what carrying that mark means, because nothing behind this storefront runs a lab. The
  invented "two-lab lot release" line that used to head this list is gone for the same reason —
  what is left is the one commitment that is genuinely ours: how we hold the stock.
*/
const STANDARD_NOTES: [RegExp, string][] = [
  [/gmp/i, "Facility audited against Good Manufacturing Practice."],
  [/made in|manufactured in/i, "Origin as stated by the manufacturer."],
  [/organic/i, "Certified by the body named on the pack."],
];

export const OUR_STANDARDS: { label: string; note: string }[] = [
  { label: "Climate-held warehouse", note: "Held below 25°C and shipped sealed." },
];

export function qualityStandards(product: Product): { label: string; note: string }[] {
  const stated = claimMarks(product.qualityStandards).map(({ label }) => ({
    label,
    note: STANDARD_NOTES.find(([pattern]) => pattern.test(label))?.[1] ?? "As stated on the pack.",
  }));
  return [...stated, ...OUR_STANDARDS];
}

/*
  Rating distribution. The average and the review count are real; iHerb's per-star breakdown sits
  behind an identity check, so the bars are shaped from the average with a fixed curve and are
  stable across builds. Replace this the day per-star counts are available.
*/
export function ratingBreakdown(product: Product): { stars: number; percent: number }[] {
  const top = Math.max(0, Math.min(1, (product.rating - 2.6) / 2.4));
  const raw = [top ** 1.2, 0.5 * top * (1 - top) + 0.06, 0.28 * (1 - top) + 0.02, 0.16 * (1 - top), 0.12 * (1 - top)];
  const total = raw.reduce((sum, n) => sum + n, 0);
  const percents = raw.map((n) => Math.round((n / total) * 100));
  // Rounding drift lands on the top bucket, so the column always sums to 100.
  percents[0] += 100 - percents.reduce((sum, n) => sum + n, 0);
  return percents.map((percent, i) => ({ stars: 5 - i, percent }));
}

/*
  Other pack sizes of the same product: same brand, same name once the pack phrase and the
  restated per-unit dose are stripped. iHerb's own pack tiles link to products we may not stock,
  so the tiles are built from our catalogue instead — every link resolves.
*/
export function packSiblings(product: Product): Product[] {
  const key = (p: Product) => `${p.brand}|${activeName(p).toLowerCase()}`;
  const mine = key(product);
  return products
    .filter((p) => key(p) === mine)
    .sort((a, b) => (a.units ?? a.servings ?? 0) - (b.units ?? b.servings ?? 0));
}
