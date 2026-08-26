// Assertions for the guides — the home strip, the index, and one article. Run with the dev
// server up:
//   node reference/guides-check.mjs
//   BASE_URL=http://localhost:3001 node reference/guides-check.mjs
//
// The photo checks are the ones that matter beyond layout: every cover is CC0, public domain or
// CC BY, and CC BY needs its credit published. If a cover ever renders without a credit line the
// site is out of licence, so that is asserted rather than trusted.
import { chromium, devices } from 'playwright-core';
import { readFileSync } from 'node:fs';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const CREDITS = JSON.parse(readFileSync('lib/editorial.generated.json', 'utf8'));
const ARTICLE = '/guides/magnesium-forms';

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

// ---------- licences, before any pixels ----------
const slugs = Object.keys(CREDITS);
check('every guide has a photo credit', slugs.length, 6);
check(
  'licences are cc0 / pdm / by only',
  slugs.filter((s) => !['cc0', 'pdm', 'by'].includes(CREDITS[s].license)).length,
  0,
);
check(
  'every credit names a creator or a source',
  slugs.filter((s) => !CREDITS[s].creator && !CREDITS[s].source).length,
  0,
);
check(
  'no cover file is wider than 2000px',
  slugs.filter((s) => (CREDITS[s].width ?? 0) > 2000).length,
  0,
);

// ---------- home strip ----------
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
const strip = page.locator('section', { has: page.getByRole('heading', { name: 'Before you buy' }) }).first();
await strip.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

check(
  'home strip links every guide',
  await strip.evaluate(
    (el) => new Set([...el.querySelectorAll('a[href^="/guides/"]')].map((a) => a.pathname)).size,
  ),
  6,
);
check(
  'home strip loads its photographs',
  await strip.locator('img').evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0)),
  true,
);
check('home strip links to the index', await strip.locator('a[href="/guides"]').count(), 1);

// ---------- index ----------
await page.goto(`${BASE}/guides`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(400);
check(
  'index lists every guide once',
  await page.evaluate(
    () => new Set([...document.querySelectorAll('a[href^="/guides/"]')].map((a) => a.pathname)).size,
  ),
  6,
);
check('index has one h1', await page.locator('h1').count(), 1);

// ---------- article ----------
await page.goto(`${BASE}${ARTICLE}`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(400);

check('article: one h1', await page.locator('h1').count(), 1);
check('article: body sections', await page.locator('article section h2').count(), 3);
check('article: takeaways', await page.locator('aside li').count(), 3);
check(
  'article: reading time is not zero',
  // No leading \b: textContent runs the tag straight into the figure, "Minerals2 min read".
  await page.evaluate(() => /[1-9]\d* min read/.test(document.body.textContent)),
  true,
);
check(
  'article: photo credit published',
  await page.evaluate(() => /Photo:\s*\S/.test(document.querySelector('figcaption')?.textContent ?? '')),
  true,
);
check(
  'article: credit links back to the source page',
  await page.locator('figcaption a[href^="https://"]').count(),
  1,
);
check(
  'article: disclaimer present',
  await page.evaluate(() => document.body.textContent.includes('Educational only')),
  true,
);
check('article: shelf link', await page.locator('a[href^="/c/minerals"]').count() > 0, true);
check('article: product rail', await page.locator('article ~ section a[href^="/p/"]').count() > 0, true);
check('article: more guides', await page.locator('a[href^="/guides/"]').count() >= 3, true);
check(
  'article: cover clears the pinned chrome when scrolled',
  await page.evaluate(async () => {
    window.scrollTo(0, 600);
    await new Promise((r) => setTimeout(r, 300));
    const aside = document.querySelector('aside > div').getBoundingClientRect();
    return aside.top >= 100;
  }),
  true,
);

// ---------- 404 and mobile ----------
const missing = await page.goto(`${BASE}/guides/not-a-guide`, { waitUntil: 'domcontentloaded', timeout: 90000 });
check('unknown slug 404s', missing.status(), 404);

const mobile = await browser.newPage({ ...devices['iPhone 13'] });
await mobile.goto(`${BASE}${ARTICLE}`, { waitUntil: 'networkidle', timeout: 90000 });
await mobile.waitForTimeout(400);
check(
  'mobile: takeaways come before the body',
  await mobile.evaluate(() => {
    const aside = document.querySelector('aside');
    const firstSection = document.querySelector('article section');
    return aside.getBoundingClientRect().top < firstSection.getBoundingClientRect().top;
  }),
  true,
);
check(
  'mobile: no horizontal overflow',
  await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  true,
);

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
