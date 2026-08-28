import {
  type CategorySlug,
  type Product,
  byCategory,
  products as allProducts,
} from "./catalog";

/*
  Starter kits — the shelf for people buying their first supplements, and the band that replaced
  Today's deals on the home page.

  Two rules shape everything here.

  First, kits are composed by rule, not by slug. A kit is a list of roles — "a magnesium
  glycinate under ฿600", "an omega-3 under ฿450" — and each role is filled with the best-selling
  in-stock product that matches. Re-run the catalogue pipeline and the kits re-resolve; nothing
  points at a product that has since gone.

  Second, the guardrails are code rather than good intentions. The audience is 16 and up, which
  rules out things the catalogue would happily supply:

  - `EXCLUDED` drops anything labelled for children, and the kids category outright. Most of the
    gummies in stock are children's lines, which is also why no kit leads on format.
  - Melatonin is excluded from every kit. It is stocked, it has a shelf and a guide, but putting
    it in a starter kit aimed at teenagers is a decision a storefront should not make for them.
  - No kit is built on a claim. Value is the real total, the real markdown where one exists, and
    days supply counted off `servings` — the label's own number. Cost per serving stays gone.

  Kits are ordered by the 30-day volume of what is in them, so the band leads with what actually
  sells rather than with whichever kit was written first.
*/

/** Children's lines, and the one ingredient a 16+ kit should not decide for the buyer. */
const EXCLUDED = /\b(kids?|children'?s?|toddler|infant|baby|junior|melatonin)\b/i;

function eligible(product: Product): boolean {
  if (!product.inStock) return false;
  if (product.category === "kids") return false;
  return !EXCLUDED.test(`${product.brand} ${product.name} ${product.form ?? ""}`);
}

export type KitRole = {
  /** What this slot is for, in the buyer's words. */
  label: string;
  /** Matched against brand, title and dosage form. */
  match: RegExp;
  /** Hard ceiling for the slot, in THB. */
  maxPrice: number;
  category?: CategorySlug;
};

type KitSpec = {
  slug: string;
  /** Kicker over the kit name. */
  eyebrow: string;
  title: string;
  /** One line on what the kit is and, where it matters, what it deliberately leaves out. */
  promise: string;
  roles: KitRole[];
  /** Guides to read first, by slug. */
  guides: string[];
};

export type Kit = {
  slug: string;
  eyebrow: string;
  title: string;
  promise: string;
  guides: string[];
  items: { role: string; product: Product }[];
  /** Sum of what the items cost today. */
  total: number;
  /** Sum of list prices, where every item has one — otherwise null, never invented. */
  listTotal: number | null;
  saving: number | null;
  /** Days the smallest pack lasts at one serving a day. */
  days: number | null;
  /** Combined 30-day volume of the items, used only for ordering. */
  volume: number;
};

const SPECS: KitSpec[] = [
  {
    slug: "everyday-basics",
    eyebrow: "Three bottles",
    title: "The ones most people are short of",
    promise:
      "Vitamin D, omega-3 and a starter probiotic. The least interesting kit here, and the one worth buying first.",
    roles: [
      { label: "Vitamin D3", match: /vitamin d3|vitamin d-3/i, maxPrice: 400 },
      { label: "Omega-3", match: /omega-3|fish oil/i, maxPrice: 500 },
      { label: "Probiotic", match: /probiotic|lactobif/i, maxPrice: 450 },
    ],
    guides: ["vitamin-d-in-bangkok", "omega-3-labels", "probiotics-survival"],
  },
  {
    slug: "wind-down",
    eyebrow: "Two bottles",
    title: "Wind-down, without the melatonin question",
    promise:
      "Magnesium glycinate and L-theanine, the two most people start with. There is no melatonin in this kit on purpose; it is on the shelf, with the guide, if you have read up on it.",
    roles: [
      { label: "Magnesium glycinate", match: /magnesium (bis)?glycinate/i, maxPrice: 650 },
      { label: "L-theanine", match: /theanine/i, maxPrice: 450 },
    ],
    guides: ["magnesium-forms"],
  },
  {
    slug: "skin-hair-nails",
    eyebrow: "Three bottles",
    title: "Skin, hair and nails",
    promise:
      "Collagen peptides, biotin and zinc, at the amounts their labels state. What they will do for you is a question for your dermatologist.",
    roles: [
      { label: "Collagen peptides", match: /collagen/i, maxPrice: 700, category: "beauty" },
      { label: "Biotin", match: /biotin/i, maxPrice: 450 },
      { label: "Zinc", match: /\bzinc\b/i, maxPrice: 350 },
    ],
    guides: ["reading-a-coa"],
  },
  {
    slug: "training-days",
    eyebrow: "Two items",
    title: "Training days",
    promise:
      "Protein to close the daily total, omega-3 for the rest of the week. We hold no creatine and no electrolytes, so the kit does not include any.",
    roles: [
      { label: "Protein powder", match: /whey|protein powder|protein, /i, maxPrice: 1200 },
      { label: "Omega-3", match: /omega-3|fish oil/i, maxPrice: 500 },
    ],
    guides: ["protein-timing", "omega-3-labels"],
  },
];

/** Best seller that fits the slot, skipping anything already used elsewhere in the kit. */
function fillRole(role: KitRole, taken: Set<string>): Product | null {
  const pool = role.category ? byCategory(role.category) : allProducts;
  const [best] = pool
    .filter(
      (p) =>
        eligible(p) &&
        p.price <= role.maxPrice &&
        !taken.has(p.slug) &&
        role.match.test(`${p.brand} ${p.name} ${p.form ?? ""}`),
    )
    .sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0));
  return best ?? null;
}

function build(spec: KitSpec): Kit | null {
  const taken = new Set<string>();
  const items: { role: string; product: Product }[] = [];

  for (const role of spec.roles) {
    const product = fillRole(role, taken);
    if (!product) continue; // a role the catalogue cannot fill is dropped, not faked
    taken.add(product.slug);
    items.push({ role: role.label, product });
  }

  // A kit is a kit at two items. One product is a product.
  if (items.length < 2) return null;

  const total = items.reduce((sum, i) => sum + i.product.price, 0);
  const everyItemHasList = items.every((i) => i.product.listPrice);
  const listTotal = everyItemHasList
    ? items.reduce((sum, i) => sum + (i.product.listPrice ?? 0), 0)
    : null;
  const servings = items.map((i) => i.product.servings).filter((s): s is number => !!s);

  return {
    slug: spec.slug,
    eyebrow: spec.eyebrow,
    title: spec.title,
    promise: spec.promise,
    guides: spec.guides,
    items,
    total,
    listTotal,
    saving: listTotal ? Math.round(listTotal - total) : null,
    days: servings.length === items.length ? Math.min(...servings) : null,
    volume: items.reduce((sum, i) => sum + (i.product.sold30d ?? 0), 0),
  };
}

/** Kits that the current catalogue can actually fill, busiest first. */
export const KITS: Kit[] = SPECS.map(build)
  .filter((k): k is Kit => k !== null)
  .sort((a, b) => b.volume - a.volume);

export const kitBySlug = new Map(KITS.map((k) => [k.slug, k]));

/**
 * Singles for the same shelf: cheap enough to try, long enough to be worth trying, and rated by
 * enough people to mean something. Every filter is a real field — nothing here is a badge we
 * awarded ourselves.
 */
export function startersUnder(maxPrice = 500, minDays = 30, limit = 12): Product[] {
  return allProducts
    .filter(
      (p) =>
        eligible(p) &&
        p.price <= maxPrice &&
        (p.servings ?? 0) >= minDays &&
        p.rating >= 4.5 &&
        p.reviews >= 500,
    )
    .sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0))
    .slice(0, limit);
}
