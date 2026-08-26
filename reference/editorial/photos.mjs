// Editorial photography: one photograph per guide, from Openverse.
//
//   node reference/editorial/photos.mjs                       # fill in what is missing
//   node reference/editorial/photos.mjs --force               # re-pick everything
//   node reference/editorial/photos.mjs --candidates <slug>   # shortlist to look through
//
// Licences are limited to `cc0`, `pdm` and `by`: public domain, or attribution-only. No
// share-alike, so nothing here puts a condition on the site around it, and no no-derivatives,
// because these get cropped to 16:9 and 4:3. CC BY needs the credit published, which the guide
// pages do for every photo whatever its licence — a storefront that prints "third-party tested"
// on the utility bar should also say where its pictures came from.
//
// Sources are tried in tiers, and that is the part that matters. An unfiltered search returns
// rawpixel derivatives with a watermark across the middle and museum scans of 19th-century
// stereoscope cards — both technically CC0, neither usable as a guide cover. Modern stock
// libraries come first, Flickr second, Wikimedia last, and the museum archives never.
//
// Photos land in public/editorial/ at whatever size the provider serves and next/image resizes
// from there, the same arrangement the product shots use. Credits are written to
// lib/editorial.generated.json, which lib/guides.ts reads.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp'; // Next's own image dependency, already installed

const API = 'https://api.openverse.org/v1/images/';
const UA = 'Nutriva-dev/1.0 (editorial image harvest; contact: dev@nutriva.example)';
const OUT_DIR = 'public/editorial';
const OUT_JSON = 'lib/editorial.generated.json';
const FORCE = process.argv.includes('--force');
const MAX_WIDTH = 2000;
const LICENSES = 'cc0,pdm,by';
const TIERS = ['stocksnap,nappy,justtakeitfree,wordpress', 'flickr', 'wikimedia'];

// One query per guide slug, best first. Kept concrete and photographic: "sunlight through a
// window" finds a picture, "vitamin D deficiency" finds diagrams and stock-photo doctors
// pointing at clipboards.
const QUERIES = {
  'vitamin-d-in-bangkok': ['sunlight window room', 'sunlight city street', 'sunshine sky'],
  'magnesium-forms': ['bedroom bed white', 'bedroom night lamp', 'made bed linen'],
  'probiotics-survival': ['fermented vegetables jar', 'yogurt bowl', 'kimchi jar'],
  'reading-a-coa': ['laboratory glassware', 'science laboratory equipment', 'test tubes lab'],
  'omega-3-labels': ['salmon fillet', 'sardines fish', 'fish market fresh'],
  'protein-timing': ['gym dumbbells', 'gym workout weights', 'protein shake bottle'],
};

mkdirSync(OUT_DIR, { recursive: true });
const credits = existsSync(OUT_JSON) && !FORCE ? JSON.parse(readFileSync(OUT_JSON, 'utf8')) : {};

// `mature=false` filters what the providers flag, which is not everything: an unclothed figure
// came back from a query about a glass of water. Anything whose title or tags hit this list is
// dropped before download, because a health storefront cannot ship a surprise.
const REJECT = /\b(naked|nude|nudity|topless|lingerie|erotic|sex|breast|buttock|underwear)\b/i;

async function search(query, source) {
  const url =
    `${API}?q=${encodeURIComponent(query)}&license=${LICENSES}&source=${source}` +
    `&page_size=20&mature=false&extension=jpg`;

  // Openverse answers a source-filtered query out of a slower path and hands back 504s and
  // dropped connections under load. Three tries with backoff, then treat the tier as empty
  // rather than losing the picks already made.
  let results = null;
  for (let attempt = 1; attempt <= 3 && results === null; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      ({ results = [] } = await res.json());
    } catch (err) {
      console.log(`      retry ${attempt}/3 — ${source} "${query}": ${err.message}`);
      if (attempt === 3) return [];
      await new Promise((r) => setTimeout(r, attempt * 4000));
    }
  }

  // Landscape only — every placement here is a 16:9 or wider crop — and wide enough that the
  // feature slot is not upscaling. Openverse's own relevance order is kept: sorting by width
  // instead returned a flower arrangement for "sunlight window room", because the widest file
  // in a tier is rarely the one that matches the words.
  return results
    .filter((r) => r.url && (r.width ?? 0) >= 1200 && (r.height ?? 1) < (r.width ?? 0))
    .filter((r) => !REJECT.test([r.title ?? '', ...(r.tags ?? []).map((t) => t.name)].join(' ')));
}

// Reviewed picks, by Openverse image id. Relevance ordering alone put a half-eaten thali under
// the probiotics guide and a home office under the one about sleep, so every cover here was
// looked at first and then pinned. `--candidates <slug>` writes the shortlist to
// reference/preview/candidates/ to look through; put the id you want here and re-run.
// A slug with no entry falls back to the queries below.
const PICKS = {
  'vitamin-d-in-bangkok': '6f60f253-d1ee-485e-9b21-16a6ec2bb6ca', // sun outside a window, desk inside
  'magnesium-forms': 'ec36e194-3b62-43da-996e-d06206dd2160', // made bed, morning light, 3:2
  'probiotics-survival': '0731e9ee-1aed-4ea4-b8c0-8e0bc26fb57f', // three jars of kimchi
  'reading-a-coa': '3141fa2e-0198-4747-82b3-d5ec88da666d', // lab glassware, coloured solutions
  'omega-3-labels': 'b76ebc76-5b42-46f6-8d35-1e878aa49bca', // fish on ice, market stall
  'protein-timing': '99439088-46d7-469a-a171-c9a982984762', // shaker being mixed in a kitchen
};

async function byId(id) {
  const res = await fetch(`${API}${id}/`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`image ${id}: HTTP ${res.status}`);
  return res.json();
}

async function download(hit, slug, dir = OUT_DIR) {
  const res = await fetch(hit.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 40_000) return false; // a thumbnail slipped through

  // Wikimedia hands back the original: 6000px and 16MB. Nothing here is shown wider than about
  // 1200 CSS px, so 2000px at q80 covers a 2× display and keeps the repo sane. next/image
  // resizes from this file the same way it does for product shots.
  const out = await sharp(buf)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  writeFileSync(`${dir}/${slug}.jpg`, out);
  const { width, height } = await sharp(out).metadata();
  return { width, height };
}

const credit = (hit, query, stored) => ({
  id: hit.id,
  title: hit.title ?? null,
  creator: hit.creator ?? null,
  source: hit.source ?? null,
  sourceUrl: hit.foreign_landing_url ?? null,
  license: hit.license ?? null,
  licenseVersion: hit.license_version ?? null,
  licenseUrl: hit.license_url ?? null,
  width: stored?.width ?? null,
  height: stored?.height ?? null,
  sourceWidth: hit.width ?? null,
  query: query ?? null,
});

// ---------- review mode ----------
const candidatesFor = process.argv.includes('--candidates')
  ? process.argv[process.argv.indexOf('--candidates') + 1]
  : null;

if (candidatesFor) {
  const dir = 'reference/preview/candidates';
  mkdirSync(dir, { recursive: true });
  const queries = QUERIES[candidatesFor];
  if (!queries) throw new Error(`no queries for ${candidatesFor}`);
  let n = 0;
  for (const source of TIERS) {
    for (const query of queries) {
      for (const hit of (await search(query, source)).slice(0, 4)) {
        const name = `${candidatesFor}-${String(++n).padStart(2, '0')}`;
        const got = await download(hit, name, dir);
        console.log(
          `${got ? 'ok  ' : 'skip'} ${name}  ${hit.id}  ${hit.width}px  ${hit.source}  "${(hit.title ?? '').slice(0, 70)}"  [${query}]`,
        );
      }
    }
  }
  console.log(`\n${n} candidates in ${dir}/ — pin the id you want in PICKS`);
  process.exit(0);
}

// ---------- harvest ----------
for (const [slug, queries] of Object.entries(QUERIES)) {
  if (credits[slug] && existsSync(`${OUT_DIR}/${slug}.jpg`)) {
    console.log(`skip  ${slug} — have ${credits[slug].title}`);
    continue;
  }

  let picked = null;

  if (PICKS[slug]) {
    const hit = await byId(PICKS[slug]);
    const stored = await download(hit, slug);
    if (stored) picked = { hit, query: null, stored };
    else console.log(`MISS  ${slug} — pinned id ${PICKS[slug]} would not download`);
  }

  // Tier before query: a mediocre modern stock photo beats the best watermarked one.
  for (const source of TIERS) {
    if (picked) break;
    for (const query of queries) {
      const hits = await search(query, source);
      for (const hit of hits.slice(0, 4)) {
        const stored = await download(hit, slug);
        if (stored) {
          picked = { hit, query, stored };
          break;
        }
      }
      if (picked) break;
    }
  }

  if (!picked) {
    console.log(`MISS  ${slug} — no usable photo for ${queries.join(' / ')}`);
    continue;
  }

  const { hit, query, stored } = picked;
  credits[slug] = { file: `/editorial/${slug}.jpg`, ...credit(hit, query, stored) };
  console.log(
    `ok    ${slug} — ${stored.width}px from ${hit.width}px "${hit.title}" (${hit.license}, ${hit.source})${query ? ` via "${query}"` : ' [pinned]'}`,
  );
}

writeFileSync(OUT_JSON, `${JSON.stringify(credits, null, 2)}\n`);
console.log(`\n${Object.keys(credits).length} photos in ${OUT_JSON}`);
