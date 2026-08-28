/*
  Stage 1 — discovery. Walks iHerb listing pages and collects product URLs, nothing else.

  Two kinds of source, because the brief is two-sided: find real products for each of our ten
  categories, and find the real products belonging to the brands we already carry. Category
  queries give breadth; brand queries make sure the catalogue keeps its own brand roster instead
  of drifting to whatever iHerb ranks first.

    node reference/iherb/discover.mjs            # merge into whatever's already found
    node reference/iherb/discover.mjs --fresh    # start the URL list over

  Writes reference/iherb/urls.json. Cheap and idempotent: re-running only adds URLs.
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openBrowser, ORIGIN, createPacer, visit } from './browser.mjs';

const HERE = 'C:/Users/sixth/Desktop/Claude-OS/reference/iherb';
const OUT = `${HERE}/urls.json`;
const PAGES = 2; // listing pages per query; page 1 alone is ~48 cards
const PER_PAGE = 26;

// One or more queries per storefront category. The query decides the category, so bucketing is
// deliberate rather than guessed from a product name.
const CATEGORY_QUERIES = {
  vitamins: ['vitamin d3 k2', 'multivitamin', 'vitamin b complex', 'vitamin c 1000 mg'],
  minerals: ['magnesium glycinate', 'zinc picolinate', 'iron bisglycinate', 'calcium magnesium'],
  omega: ['fish oil omega 3', 'krill oil', 'algae omega dha'],
  gut: ['probiotics cfu', 'digestive enzymes', 'psyllium fiber'],
  sleep: ['melatonin sleep', 'ashwagandha stress', 'l-theanine magnesium sleep'],
  immunity: ['immune support vitamin c', 'elderberry zinc', 'quercetin bromelain'],
  herbs: ['turmeric curcumin', 'milk thistle', 'ginkgo biloba', 'berberine'],
  sports: ['whey protein powder', 'creatine monohydrate', 'electrolyte powder', 'bcaa amino'],
  beauty: ['collagen peptides', 'biotin hair skin nails', 'hyaluronic acid'],
  kids: ['kids multivitamin gummies', 'kids probiotic', 'prenatal vitamin'],
};

// Brands the placeholder catalogue already carried, most-stocked first — these are "our brands".
const BRANDS = [
  'California Gold Nutrition',
  'NOW Foods',
  "Doctor's Best",
  'Sports Research',
  'Life Extension',
  'Solgar',
  "Nature's Way",
  'Thorne',
  'Jarrow Formulas',
  'Garden of Life',
  'MegaFood',
  'NaturesPlus',
  'Swanson',
  '21st Century',
  'Vital Proteins',
  'Nordic Naturals',
];

const listingUrl = (source, page) =>
  source.path
    ? `${ORIGIN}${source.path}${page > 1 ? `${source.path.includes('?') ? '&' : '?'}p=${page}` : ''}`
    : `${ORIGIN}/search?kw=${encodeURIComponent(source.kw)}${page > 1 ? `&p=${page}` : ''}`;

/*
  Marked-down stock, so the deals rail and /deals show real markdowns rather than invented ones.
  Products found here get no category from the query; build.mjs buckets them from their breadcrumb
  trail, which also means an off-taxonomy special (a toothpaste, say) is dropped rather than
  forced into a supplement category.
*/
const SPECIALS = [
  { path: '/specials', pages: 4 },
  { path: '/c/specials', pages: 2 },
];

const readCards = (limit) =>
  Array.from(document.querySelectorAll('.product-cell-container'))
    .slice(0, limit)
    .map((cell) => {
      const anchor = cell.querySelector('a[href*="/pr/"]');
      const img = cell.querySelector('img');
      const text = cell.innerText || '';
      return {
        url: anchor?.href?.split('?')[0] ?? null,
        title: cell.querySelector('.product-title')?.textContent?.trim() ?? null,
        listingImage: img?.currentSrc || img?.getAttribute('src') || null,
        reviews: cell.querySelector('.rating-count')?.textContent?.trim() ?? null,
        sold: (text.match(/([\d.]+K?\+?)\s*sold in 30 days/i) ?? [])[1] ?? null,
        flag: cell.querySelector('.product-flag')?.textContent?.trim() ?? null,
      };
    })
    .filter((row) => row.url && row.title);

mkdirSync(HERE, { recursive: true });
const fresh = process.argv.includes('--fresh');
const found = new Map();
if (!fresh && existsSync(OUT)) {
  for (const row of JSON.parse(readFileSync(OUT, 'utf8')).products) found.set(row.pid, row);
}
console.log(`starting from ${found.size} known products`);

const onlySpecials = process.argv.includes('--specials');
const sources = onlySpecials
  ? SPECIALS.flatMap((source) =>
      Array.from({ length: source.pages }, (_, i) => ({ ...source, kw: source.path, page: i + 1 })),
    )
  : [
      ...Object.entries(CATEGORY_QUERIES).flatMap(([category, queries]) =>
        queries.flatMap((kw) => Array.from({ length: PAGES }, (_, i) => ({ category, kw, page: i + 1 }))),
      ),
      ...BRANDS.map((kw) => ({ category: null, kw, page: 1, brand: kw })),
      ...SPECIALS.flatMap((source) =>
        Array.from({ length: source.pages }, (_, i) => ({ ...source, kw: source.path, page: i + 1 })),
      ),
    ];

const ctx = await openBrowser();
const pacer = createPacer({ start: 7000, min: 4500, max: 40000 });
let index = 0;

for (const source of sources) {
  index++;
  const label = `${String(index).padStart(3)}/${sources.length} ${source.kw}${source.page > 1 ? ` p${source.page}` : ''}`;
  const rows = await visit(ctx, listingUrl(source, source.page), (page) => page.evaluate(readCards, PER_PAGE), {
    pacer,
    scroll: 8000,
  });

  let added = 0;
  for (const row of rows ?? []) {
    const pid = row.url.match(/\/(\d+)$/)?.[1];
    if (!pid) continue;
    const existing = found.get(pid);
    if (existing) {
      // A product surfacing under a category query is better bucketed than one found via a
      // brand query, so let a category assignment overwrite a null.
      if (!existing.category && source.category) existing.category = source.category;
      continue;
    }
    found.set(pid, { pid, ...row, category: source.category ?? null, foundVia: source.kw });
    added++;
  }
  console.log(`${label} -> ${rows?.length ?? 0} cards, +${added} new (total ${found.size}, pace ${pacer.delay}ms)`);

  writeFileSync(
    OUT,
    JSON.stringify({ discoveredAt: new Date().toISOString(), products: [...found.values()] }, null, 1),
  );
  await pacer.wait();
}

await ctx.close();

const byCategory = [...found.values()].reduce((acc, row) => {
  const key = row.category ?? 'unbucketed';
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});
console.log(`\n${found.size} unique products ->`, byCategory);
