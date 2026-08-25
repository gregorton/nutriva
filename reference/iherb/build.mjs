/*
  Stage 3 — build. Folds the per-product scrapes into lib/catalog.generated.json, the single
  file lib/catalog.ts reads.

    node reference/iherb/build.mjs

  Nothing here invents data. Every field is either copied from the scrape or computed from two
  copied fields (per-serving cost from price and servings, discount from price and list price).
  Where iHerb states nothing, the field is null and the storefront omits the panel.
*/
import { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';

const HERE = 'C:/Users/sixth/Desktop/Claude-OS/reference/iherb';
const CACHE = `${HERE}/products`;
const OUT = 'C:/Users/sixth/Desktop/Claude-OS/lib/catalog.generated.json';
const IMG_DIR = 'C:/Users/sixth/Desktop/Claude-OS/public/products/iherb';

// Our ten categories, matched against the iHerb breadcrumb trail. Order is the priority order:
// a kids' magnesium gummy belongs in kids, not minerals.
const CATEGORY_RULES = [
  ['kids', /\bkids?\b|children|toddler|infant|baby|prenatal|maternity/i],
  ['beauty', /collagen|hair, skin|hair skin|biotin|beauty|nail/i],
  ['sports', /sports nutrition|\bprotein\b|creatine|amino acid|bcaa|electrolyte|pre-?workout/i],
  ['gut', /probiotic|digestion|digestive|enzyme|\bfiber\b|\bfibre\b|prebiotic/i],
  ['omega', /omega|fish oil|krill|\bepa\b|\bdha\b|cod liver/i],
  ['sleep', /sleep|melatonin|stress|adaptogen|ashwagandha|theanine|valerian|relax/i],
  ['immunity', /immune|elderberry|echinacea|quercetin/i],
  ['herbs', /\bherbs?\b|herbal|turmeric|curcumin|milk thistle|ginkgo|berberine|botanical|ginseng|mushroom/i],
  ['minerals', /mineral|magnesium|\bzinc\b|\biron\b|calcium|selenium|potassium/i],
  ['vitamins', /vitamin|multivitamin|\bfolate\b|\bb-?12\b/i],
  // Greens, algae and single-botanical extracts file under Supplements on iHerb but have no
  // taxonomy node of ours; herbs is where a standardised plant extract belongs.
  ['herbs', /greens|superfood|algae|spirulina|chlorella|apple cider vinegar|antioxidant/i],
];

const VALID = new Set(CATEGORY_RULES.map(([slug]) => slug));

// Pack phrase in an iHerb title: "180 Tablets", "240 Veggie Capsules", "60 Gummies".
const PACK =
  /(\d[\d,]*)\s+((?:[A-Za-z][A-Za-z-]*\s+){0,2})?(Capsules?|Softgels?|Tablets?|Gummies|Gels?|Packets?|Chewables?|Lozenges?|Sachets?|Servings?|Caps?|Count|Wafers?|Strips?|Sticks?)\b/i;
const FORM_DESCRIPTOR = /^(Veggie|Veg|Vegetarian|Vegan|Vegetable|Plant-Based|Liquid|Chewable|Soft|Fish|Enteric)$/i;
const DOSE = /(\d[\d,.]*\s?(?:mg|mcg|µg|g|kg|ml|fl oz|oz|IU|billion CFU|CFU))\b/i;

const num = (text) => {
  if (!text) return null;
  const match = String(text).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};
const baht = (text) => (text && text.includes('฿') ? num(text.replace(/[^\d.,]/g, '')) : null);

/** "90,000+ sold in 30 days" -> 90000; "1.2K sold in 30 days" -> 1200. */
function parseSold(lines) {
  for (const line of lines ?? []) {
    const match = line.match(/([\d.,]+)\s*(K)?\+?\s*sold in 30 days/i);
    if (!match) continue;
    const value = Number(match[1].replace(/,/g, ''));
    return Math.round(match[2] ? value * 1000 : value);
  }
  return null;
}

/*
  Pricing. A product at list price states `offers.price`. A marked-down one leaves that null and
  puts two `UnitPriceSpecification` entries in `offers.priceSpecification` instead — the sale price,
  and the list price tagged `StrikethroughPrice`. Reading both is what makes the markdowns real
  rather than synthesised.
*/
function parsePrice(offers) {
  const specs = Array.isArray(offers?.priceSpecification) ? offers.priceSpecification : [];
  const struck = num(specs.find((spec) => /StrikethroughPrice/i.test(spec.priceType ?? ''))?.price);
  const current = num(specs.find((spec) => !spec.priceType)?.price) ?? num(offers?.price);
  return {
    price: current,
    listPrice: struck && current && struck > current ? struck : null,
  };
}

/**
 * Fallback for the markdown when `priceSpecification` carries none: read the buy box.
 *
 * Guarded, because the DOM walk that found the buy box can land on a cross-sell card instead —
 * several product pages render a "Frequently purchased together" tile before their own buy box.
 * If the captured lines don't contain this product's own price, they belong to something else
 * and are thrown away rather than used to invent a markdown.
 */
function parseMarkdown(lines, price) {
  const values = (lines ?? []).map(baht).filter((value) => value !== null);
  const isOurs = values.some((value) => Math.abs(value - price) < 1);
  if (!isOurs) return { listPrice: null, discount: null };

  const higher = values.filter((value) => value > price + 1);
  if (higher.length) return { listPrice: Math.min(...higher), discount: null };

  const percent = num((lines ?? []).find((line) => /%\s?off/i.test(line))?.match(/(\d+)\s?%/)?.[0]);
  if (percent && percent > 0 && percent < 90) {
    return { listPrice: Math.round((price / (1 - percent / 100)) * 100) / 100, discount: percent };
  }
  return { listPrice: null, discount: null };
}

/**
 * The supplement-facts table as scraped: some leading full-width rows carrying the heading,
 * serving size and servings per container, a column-head row, then one row per ingredient.
 * Ingredient rows are the ones with a name in the first cell and something in the second.
 */
function parseFacts(rows, footnotes) {
  if (!rows?.length) return null;
  let servingSize = null;
  let servingsPerContainer = null;
  const ingredients = [];

  for (const cells of rows) {
    const joined = cells.join(' ').replace(/\s+/g, ' ').trim();
    if (/^supplement facts$/i.test(joined)) continue;
    if (/amount\s*per serving/i.test(joined) && /daily value/i.test(joined)) continue;
    const serving = joined.match(/serving size:?\s*(.+?)(?:\s*serving[s]? per container|$)/i);
    if (serving && !servingSize) servingSize = serving[1].trim() || null;
    const perContainer = joined.match(/servings? per container:?\s*(?:about\s*)?([\d.,]+)/i);
    if (perContainer && !servingsPerContainer) servingsPerContainer = perContainer[1].trim();
    if (/serving size|per container/i.test(joined)) continue;

    const [name, amount, dailyValue] = cells;
    const label = (name ?? '').trim();
    if (!label || !(amount ?? '').trim()) continue;
    ingredients.push({
      name: label,
      amount: amount.trim(),
      dailyValue: (dailyValue ?? '').trim() || null,
    });
  }

  if (!ingredients.length && !servingSize) return null;
  /*
    Footnotes are scraped from the text around the table, which also picks up the column heads
    and — where the table is one flat text node — the whole panel. Keep only short lines that
    read like a footnote: a symbol-led note, or the standard %DV basis sentence.
  */
  const notes = (footnotes ?? [])
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(
      (line) =>
        line.length > 4 &&
        line.length < 200 &&
        !/amount per serving/i.test(line) &&
        (/^[*†‡]/.test(line) || /daily value (?:not established|is not established|based on)/i.test(line)),
    );
  return {
    servingSize,
    servingsPerContainer,
    rows: ingredients,
    footnotes: [...new Set(notes)],
  };
}

/** Pack count and dosage form out of the title: "180 Tablets" -> 180 / "Tablets". */
function parsePack(title) {
  const match = title.match(PACK);
  if (!match) return { units: null, unitForm: null };
  const words = (match[2] ?? '').trim().split(/\s+/).filter(Boolean);
  const adjacent = words[words.length - 1];
  const noun = match[3].replace(/^caps?$/i, 'Capsules');
  const form = adjacent && FORM_DESCRIPTOR.test(adjacent) ? `${adjacent} ${noun}` : noun;
  return {
    units: num(match[1]),
    unitForm: /^count$/i.test(form) ? null : form.replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

/** "2 tablets" -> "Tablets": the fallback when the title states no dosage form. */
function formFromServingSize(servingSize) {
  const match = servingSize?.match(
    /\b(capsules?|softgels?|tablets?|gummies|gels?|packets?|chewables?|lozenges?|sachets?|scoops?|wafers?|drops?|ml|g)\b/i,
  );
  if (!match) return null;
  const word = match[1].toLowerCase();
  if (word === 'ml' || word === 'g') return null;
  const plural = /s$|ies$/.test(word) ? word : `${word}s`;
  return plural.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pulls a labelled block out of the scraped prose by heading. */
const blockNamed = (blocks, pattern) => blocks.find((block) => pattern.test(block.label ?? ''));

/** Reads a named row out of an at-a-glance section ("Key info" -> "Best by"). */
function glanceValue(atAGlance, pattern) {
  for (const section of atAGlance ?? []) {
    for (const item of section.items ?? []) {
      if (pattern.test(item.label ?? '')) return item.value ?? null;
    }
  }
  return null;
}

function glanceChips(atAGlance, pattern) {
  const section = (atAGlance ?? []).find((entry) => pattern.test(entry.title ?? ''));
  return section?.chips?.length ? section.chips : [];
}

function categoryFor(raw) {
  if (raw.discovery?.category && VALID.has(raw.discovery.category)) return raw.discovery.category;
  const trail = [...(raw.breadcrumbs ?? []), raw.ld?.name ?? ''].join(' > ');
  return CATEGORY_RULES.find(([, pattern]) => pattern.test(trail))?.[0] ?? null;
}

// ---------------------------------------------------------------- build

const files = existsSync(CACHE) ? readdirSync(CACHE).filter((name) => name.endsWith('.json')) : [];
if (!files.length) {
  console.error('No scraped products in reference/iherb/products — run discover.mjs then harvest.mjs first.');
  process.exit(1);
}

const items = [];
const dropped = [];

for (const file of files) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(`${CACHE}/${file}`, 'utf8'));
  } catch {
    // Half-written file — harvest.mjs is probably still running. Skip it; the next build picks it up.
    dropped.push(`${file} — unreadable`);
    continue;
  }
  const ld = raw.ld;
  const { price, listPrice: declaredList } = parsePrice(ld?.offers);
  const category = categoryFor(raw);
  const rating = num(ld?.aggregateRating?.ratingValue);

  // A product needs a name, a price, a photo, a category and a rating to fill a card. Anything
  // short of that is dropped rather than padded out with a placeholder.
  if (!ld?.name || !price || !raw.images?.length || !category || !rating) {
    const reason = !category
      ? 'no category'
      : !raw.images?.length
        ? 'no image'
        : !rating
          ? 'no rating'
          : 'no price';
    dropped.push(`${raw.pid} ${(ld?.name ?? file).slice(0, 50)} — ${reason}`);
    continue;
  }

  const name = ld.name.replace(/\s+/g, ' ').trim();
  const brand = (ld.brand?.name ?? name.split(',')[0]).trim();
  // iHerb titles lead with the brand; our cards print the brand separately.
  const title = name.startsWith(`${brand},`) ? name.slice(brand.length + 1).trim() : name;

  const facts = parseFacts(raw.factsRows, raw.factsFootnotes);
  const specs = Object.fromEntries((raw.specs ?? []).map((spec) => [spec.label.toLowerCase(), spec.value]));

  const servingSize = glanceValue(raw.atAGlance, /serving size/i) ?? facts?.servingSize ?? null;
  const servings =
    num(glanceValue(raw.atAGlance, /total servings/i)) ?? num(facts?.servingsPerContainer) ?? null;
  const { units, unitForm } = parsePack(name);
  const form = unitForm ?? formFromServingSize(servingSize);

  // One labelled active means the amount is the product's dose; a multi-ingredient blend has no
  // single dose, so read it from the title only when the label doesn't give one.
  const dose =
    facts?.rows.length === 1
      ? facts.rows[0].amount
      : (name.replace(PACK, ' ').match(DOSE)?.[1]?.replace(/\s+/g, ' ') ?? null);

  const { listPrice, discount } = declaredList
    ? { listPrice: declaredList, discount: null }
    : parseMarkdown(raw.buyBoxLines, price);
  const overview = blockNamed(raw.blocks, /^overview$/i);
  const warningsBlock = blockNamed(raw.blocks, /warning/i);
  const warningLines = [...(warningsBlock?.paragraphs ?? []), ...(warningsBlock?.bullets ?? [])];

  items.push({
    pid: raw.pid,
    slug: raw.slug,
    brand,
    name,
    title,
    category,
    source: raw.url,
    image: raw.images[0],
    images: raw.images,

    price: Math.round(price * 100) / 100,
    listPrice,
    discountLabel: discount ? `${discount}% off` : null,
    inStock: /InStock/i.test(ld.offers?.availability ?? '') || /^in stock$/i.test(raw.stockLines?.[0] ?? ''),
    sold30d: parseSold(raw.stockLines) ?? null,

    rating: num(ld.aggregateRating?.ratingValue),
    reviews: num(ld.aggregateRating?.reviewCount) ?? 0,
    rankings: (raw.rankings ?? []).map((entry) => ({
      rank: entry.rank.replace(/\s*in$/i, '').trim(),
      category: entry.category,
    })),

    productCode: ld.mpn ?? specs['product code'] ?? null,
    upc: ld.gtin12 ?? specs.upc ?? null,
    // ld.size is a bottle measurement ("2.7x2.7"), not a pack count — the spec row is the one.
    packQuantity: specs['package quantity'] ?? null,
    units,
    form,
    servingSize,
    servings,
    perServing: servings ? Math.round((price / servings) * 100) / 100 : null,
    dose,
    shippingWeight: specs['shipping weight'] ?? null,
    // The spec row restates the weight after the dimensions; the weight has its own row already.
    dimensions: specs.dimensions?.split(',')[0].trim() ?? null,
    firstAvailable: specs['first available'] ?? null,
    bestBy: glanceValue(raw.atAGlance, /best by/i),

    certifications: glanceChips(raw.atAGlance, /certification|diet/i),
    qualityStandards: glanceChips(raw.atAGlance, /quality standards|manufacturing/i),

    highlights: overview?.bullets ?? [],
    overview: overview?.paragraphs ?? [],
    suggestedUse: blockNamed(raw.blocks, /suggested use|directions|how to use/i)?.paragraphs ?? [],
    otherIngredients: blockNamed(raw.blocks, /other ingredients|ingredients/i)?.paragraphs ?? [],
    // iHerb files storage advice under Warnings; it reads better as its own panel.
    warnings: warningLines.filter((line) => !/^store /i.test(line)),
    storage: warningLines.filter((line) => /^store /i.test(line)),
    supplementFacts: facts,

    packVariants: (raw.packVariants ?? [])
      .filter((variant) => variant.label && variant.pid !== raw.pid)
      .map((variant) => ({
        label: variant.label,
        pid: variant.pid,
        price: baht(variant.price),
        outOfStock: Boolean(variant.outOfStock),
      })),
  });
}

// Most-reviewed first inside each category: the closest thing to a real popularity signal, and
// it keeps the top of every grid on products that actually carry label data.
items.sort(
  (a, b) => a.category.localeCompare(b.category) || (b.reviews ?? 0) - (a.reviews ?? 0),
);

/*
  Slugs come from the title, and iHerb occasionally lists the same product twice under two ids —
  or two sizes whose titles collide once truncated. A duplicate slug would silently lose a product
  from `productBySlug` and emit a repeated static path, so keep the better-reviewed one.
*/
const bySlug = new Map();
const collisions = [];
for (const item of items) {
  const existing = bySlug.get(item.slug);
  if (!existing) {
    bySlug.set(item.slug, item);
  } else if (item.reviews > existing.reviews) {
    bySlug.set(item.slug, item);
    collisions.push(`${item.slug} (kept ${item.pid} over ${existing.pid})`);
  } else {
    collisions.push(`${item.slug} (kept ${existing.pid} over ${item.pid})`);
  }
}
const unique = items.filter((item) => bySlug.get(item.slug) === item);

writeFileSync(
  OUT,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), source: 'th.iherb.com', currency: 'THB', items: unique },
    null,
    1,
  ),
);
items.length = 0;
items.push(...unique);

const byCategory = items.reduce((acc, item) => ((acc[item.category] = (acc[item.category] ?? 0) + 1), acc), {});
const withFacts = items.filter((item) => item.supplementFacts?.rows.length).length;
const withOverview = items.filter((item) => item.overview.length || item.highlights.length).length;
const withDv = items.filter((item) => item.supplementFacts?.rows.some((row) => row.dailyValue)).length;

console.log(`${items.length} products written to lib/catalog.generated.json`);
console.log(byCategory);
console.log(
  `supplement facts ${withFacts} | with %DV ${withDv} | overview copy ${withOverview} | ` +
    `suggested use ${items.filter((i) => i.suggestedUse.length).length} | ` +
    `warnings ${items.filter((i) => i.warnings.length).length} | ` +
    `markdowns ${items.filter((i) => i.listPrice).length} | ` +
    `real ratings ${items.filter((i) => i.rating).length}`,
);
if (dropped.length) console.log(`\ndropped ${dropped.length}:\n  ${dropped.slice(0, 15).join('\n  ')}`);
if (collisions.length) console.log(`\nduplicate slugs merged ${collisions.length}:\n  ${collisions.join('\n  ')}`);

/*
  Harvest downloads images for every product it visits, including the ones this stage then drops
  for having no category or no price. `--prune` clears those orphans out of public/. Opt-in, not
  automatic: a build should never delete files as a side effect, and the orphans are harmless
  until the bundle size matters.
*/
if (process.argv.includes('--prune') && existsSync(IMG_DIR)) {
  const referenced = new Set(items.flatMap((item) => item.images.map((path) => path.split('/').pop())));
  const orphans = readdirSync(IMG_DIR).filter((file) => !referenced.has(file));
  for (const file of orphans) unlinkSync(`${IMG_DIR}/${file}`);
  console.log(`\npruned ${orphans.length} unreferenced images; ${referenced.size} kept`);
}

