/*
  Stage 2 — product pages. Visits every URL discovery found and pulls the real thing:
  iHerb's own overview copy, specifications, suggested use, other ingredients, warnings,
  the supplement-facts table with %DV, certifications, pack variants, rankings, genuine
  ratings and review counts, and the product photography.

    node reference/iherb/harvest.mjs             # resume; skips products already cached
    node reference/iherb/harvest.mjs --limit 40  # bounded run
    node reference/iherb/harvest.mjs --refresh   # re-scrape even if cached

  Writes one file per product to reference/iherb/products/<pid>.json and images to
  public/products/iherb/. Resumable by design — the bot check will eventually cut a long run
  short, and re-running picks up exactly where it stopped.
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs';
import { openBrowser, createPacer, visit, largeImage, downloadImage } from './browser.mjs';

const HERE = 'C:/Users/sixth/Desktop/Claude-OS/reference/iherb';
const CACHE = `${HERE}/products`;
const IMG_DIR = 'C:/Users/sixth/Desktop/Claude-OS/public/products/iherb';
const MAX_IMAGES = 4;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const LIMIT = arg('--limit', Infinity);
const REFRESH = process.argv.includes('--refresh');
// Marked-down stock only. Discovery records the listing path a product came from, and the specials
// pages are the only sources whose name is a path — that's the filter.
const SPECIALS_ONLY = process.argv.includes('--specials');

// 90 chars, not 70: iHerb titles put the differentiating pack size last, so a shorter cap makes
// "CollagenUp, 206 g" and "CollagenUp, 464 g" slug identically. build.mjs merges any collision
// that still happens and logs it.
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[®™]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
    .replace(/-$/, '');

mkdirSync(CACHE, { recursive: true });
mkdirSync(IMG_DIR, { recursive: true });

const discovered = JSON.parse(readFileSync(`${HERE}/urls.json`, 'utf8')).products;

/*
  Round-robin the queue across categories rather than taking discovery order, which is
  category-by-category. Two things fall out of that: a --limit run covers every category instead
  of finishing vitamins, and a run cut short by the bot check leaves a balanced catalogue rather
  than a lopsided one. Within a category the discovery order is kept, so the most relevant
  products are fetched first.
*/
function interleave(rows) {
  const buckets = new Map();
  for (const row of rows) {
    const key = row.category ?? 'unbucketed';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const lists = [...buckets.values()];
  const out = [];
  for (let i = 0; out.length < rows.length; i++) {
    for (const list of lists) if (i < list.length) out.push(list[i]);
  }
  return out;
}

const queue = interleave(discovered)
  .filter((p) => !SPECIALS_ONLY || String(p.foundVia ?? '').startsWith('/'))
  .filter((p) => REFRESH || !existsSync(`${CACHE}/${p.pid}.json`))
  .slice(0, LIMIT);
console.log(`${discovered.length} discovered, ${queue.length} to fetch`);

/* Runs in the page. Everything below is read from the DOM as iHerb renders it — no derivation,
   no inference. Anything the page doesn't state comes back null and the build stage leaves the
   corresponding panel out. */
function extractPdp() {
  const clean = (s) => (s ? s.replace(/\s+/g, ' ').trim() || null : null);
  const lines = (el) =>
    el
      ? (el.innerText || '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

  let ld = null;
  let breadcrumbs = null;
  for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(el.textContent);
      if (parsed['@type'] === 'Product') ld = parsed;
      if (parsed['@type'] === 'BreadcrumbList')
        breadcrumbs = (parsed.itemListElement ?? []).map((entry) => entry.item?.name).filter(Boolean);
    } catch {
      /* iHerb ships a couple of malformed blocks; the ones we want parse fine */
    }
  }

  // ---- prose blocks: Overview / Suggested use / Other ingredients / Warnings / Disclaimer ----
  const blocks = [];
  const overviewRoot = document.querySelector('#product-overview');
  for (const heading of overviewRoot?.querySelectorAll('h3') ?? []) {
    const label = clean(heading.textContent);
    if (!label || /supplement facts|specifications/i.test(label)) continue; // handled structurally
    const holder = heading.parentElement;
    const bullets = [...holder.querySelectorAll('ul:not(#product-specs-list) > li')]
      .map((li) => clean(li.textContent))
      .filter(Boolean);
    let paragraphs = [...holder.querySelectorAll('p')].map((p) => clean(p.textContent)).filter(Boolean);
    if (!bullets.length && !paragraphs.length) {
      // Some blocks are bare text in a div rather than wrapped in <p>.
      paragraphs = lines(holder).filter((line) => line !== label);
    }
    blocks.push({ label, bullets, paragraphs });
  }

  // ---- specifications list ----
  const specs = [];
  for (const li of document.querySelectorAll('#product-specs-list > li')) {
    const copy = li.cloneNode(true);
    for (const noise of copy.querySelectorAll('cms-popover, .cms-popover-tooltip, button, svg')) noise.remove();
    const text = clean(copy.textContent);
    if (!text) continue;
    const split = text.indexOf(':');
    if (split === -1) continue;
    specs.push({ label: text.slice(0, split).trim(), value: text.slice(split + 1).trim() });
  }

  // ---- supplement facts: kept as raw cells, interpreted in the build stage ----
  const factsTable = document.querySelector('.supplement-facts-container table');
  const factsRows = factsTable
    ? [...factsTable.querySelectorAll('tr')].map((tr) => [...tr.children].map((cell) => clean(cell.textContent) ?? ''))
    : null;
  const factsFootnotes = factsTable
    ? lines(factsTable.parentElement).filter((line) => /^[*†‡]/.test(line) || /daily value/i.test(line))
    : [];

  // ---- at-a-glance: key info, certifications and diet, quality standards ----
  const atAGlance = [...document.querySelectorAll('.product-at-a-glance__section')].map((section) => {
    const title = clean(section.querySelector('.product-at-a-glance__title')?.textContent);
    const items = [...section.querySelectorAll('.product-at-a-glance__key-info-item')].map((item) => ({
      label: clean(item.querySelector('.product-at-a-glance__key-info-label')?.textContent),
      value: clean(item.querySelector('.product-at-a-glance__key-info-value')?.textContent),
    }));
    const chips = items.length ? [] : lines(section).filter((line) => line !== title);
    return { title, items, chips };
  });

  // ---- other pack sizes of the same product ----
  const packVariants = [...document.querySelectorAll('.attribute-group-package-quantity .attribute-tile')].map(
    (tile) => ({
      label: tile.dataset.val ?? null,
      pid: tile.dataset.pid ?? null,
      url: tile.dataset.url ?? null,
      price: clean(tile.querySelector('.price')?.textContent),
      outOfStock: tile.dataset.isOutOfStock === 'True',
      selected: tile.classList.contains('combo-selected'),
    }),
  );

  // ---- rankings, stock, markdown ----
  const rankings = [...document.querySelectorAll('.best-selling-rank > div')]
    .map((row) => ({
      rank: clean(row.querySelector('.rank')?.textContent),
      category: clean(row.querySelector('a.crumbs')?.textContent),
      href: row.querySelector('a.crumbs')?.getAttribute('href') ?? null,
    }))
    .filter((row) => row.rank && row.category);
  const stockLines = lines(document.querySelector('.product-description-stock-status'));

  // The buy box, found by walking up from its own Add to Cart button. Scoping the markdown read
  // this way matters: "25% off" appears all over the page on sponsored cross-sells, and a
  // document-wide search would hand this product someone else's discount.
  const addToCart = [...document.querySelectorAll('button, a')].find((el) =>
    /^add to cart$/i.test((el.innerText || '').trim()),
  );
  let buyBox = addToCart;
  for (let i = 0; i < 6 && buyBox; i++) {
    if ((buyBox.innerText || '').includes('฿')) break;
    buyBox = buyBox.parentElement;
  }
  const buyBoxLines = lines(buyBox).slice(0, 14);

  // ---- imagery: every shot sharing this product's asset folder ----
  const mainSrc = document.querySelector('#iherb-product-image')?.currentSrc || ld?.logo || null;
  const folder = mainSrc?.match(/\/images\/[^/]+\/[^/]+\//)?.[0] ?? null;
  const gallery = folder
    ? [...new Set([...document.querySelectorAll('img')].map((img) => img.currentSrc || img.src))].filter((src) =>
        src.includes(folder),
      )
    : [];

  return {
    url: location.href.split('?')[0],
    pageTitle: document.title,
    h1: clean(document.querySelector('h1')?.innerText),
    ld,
    breadcrumbs,
    blocks,
    specs,
    factsRows,
    factsFootnotes,
    atAGlance,
    packVariants,
    rankings,
    stockLines,
    buyBoxLines,
    mainSrc,
    gallery,
  };
}

/**
 * Main shot first, then alternates, deduped by Cloudinary asset number. Each entry carries both
 * the upscaled URL and the one the page actually used: the `/l/` rendition is bigger but does not
 * exist for every asset, so the download falls back rather than losing the view.
 */
function pickImages(payload) {
  const assetOf = (url) => url.match(/\/([^/]+)\.jpg$/i)?.[1] ?? url;
  const mainAsset = payload.mainSrc ? assetOf(payload.mainSrc) : null;
  const seen = new Set();
  const ordered = [
    ...(payload.mainSrc ? [payload.mainSrc] : []),
    ...payload.gallery.filter((src) => assetOf(src) !== mainAsset),
  ];
  const out = [];
  for (const src of ordered) {
    const asset = assetOf(src);
    if (seen.has(asset)) continue;
    seen.add(asset);
    out.push([largeImage(src), src]);
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

const ctx = await openBrowser();
const pacer = createPacer({ start: 5500, min: 3500, max: 45000 });

/*
  Three tabs in flight. Product-page latency, not politeness, is what makes a serial run take
  hours: each page is ~20 s of waiting and almost no work. Overlapping three of them cuts the run
  to a third without tripling the request rate, because a shared gate still spaces the *starts* —
  and the gate widens whenever the pacer is penalised, so one challenge slows every worker at once.
*/
const CONCURRENCY = 3;
let gateAt = 0;
async function gate() {
  const spacing = Math.round(pacer.delay / 2);
  const now = Date.now();
  const at = Math.max(now, gateAt);
  gateAt = at + spacing;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

let cursor = 0;
let done = 0;
let failed = 0;
let consecutiveFailures = 0;
let stopped = false;

async function worker() {
  while (!stopped) {
    const entry = queue[cursor++];
    if (!entry) return;
    await gate();
    if (stopped) return;

    const payload = await visit(ctx, entry.url, (page) => page.evaluate(extractPdp), {
      pacer,
      scroll: 9500,
      settle: 1900,
    });
    done++;

    if (!payload?.ld?.name) {
      failed++;
      if (++consecutiveFailures >= 10) {
        stopped = true;
        console.log('\n10 failures in a row — the bot check has clamped down. Stopping; re-run to resume.');
        return;
      }
      console.log(`${String(done).padStart(3)}/${queue.length} ${entry.pid} FAILED`);
      continue;
    }
    consecutiveFailures = 0;

    const slug = slugify(payload.ld.name);
    const saved = [];
    for (const [i, candidates] of pickImages(payload).entries()) {
      const file = i === 0 ? `${slug}.jpg` : `${slug}-${i + 1}.jpg`;
      let error = null;
      for (const src of candidates) {
        try {
          await downloadImage(src, `${IMG_DIR}/${file}`, fs);
          saved.push(`/products/iherb/${file}`);
          error = null;
          break;
        } catch (err) {
          error = err;
        }
      }
      if (error) console.log(`    img ${file}: ${error.message}`);
    }

    writeFileSync(
      `${CACHE}/${entry.pid}.json`,
      JSON.stringify(
        {
          pid: entry.pid,
          slug,
          scrapedAt: new Date().toISOString(),
          discovery: { category: entry.category, foundVia: entry.foundVia, sold: entry.sold, flag: entry.flag },
          images: saved,
          ...payload,
        },
        null,
        1,
      ),
    );

    const rating = payload.ld.aggregateRating;
    console.log(
      `${String(done).padStart(3)}/${queue.length} ${slug.slice(0, 52).padEnd(52)} ` +
        `฿${payload.ld.offers?.price ?? '?'} ${rating ? `${rating.ratingValue}(${rating.reviewCount})` : 'no rating'} ` +
        `${saved.length}img ${payload.blocks.length}blk ${payload.factsRows ? `${payload.factsRows.length}facts` : 'no facts'} ${pacer.delay}ms`,
    );
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

await ctx.close();
console.log(`\n${done - failed} harvested, ${failed} failed. Cached: ${fs.readdirSync(CACHE).length} products.`);
