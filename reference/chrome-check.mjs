// Assertions for the pinned chrome (masthead + category row) and the card rating. Run with the
// dev server up:
//   node reference/chrome-check.mjs
//   BASE_URL=http://localhost:3001 node reference/chrome-check.mjs   (when dev picked another port)
//
// What it holds to: the chrome pins at the top of the viewport once the utility strip has
// scrolled past, condenses to --spacing-chrome (103px) when it does, the category panel still
// opens under it, in-page anchors and the sticky buy box clear it, the mobile search row folds
// away while its icon stands in, and product cards show stars with no numeric average.
import { chromium, devices } from 'playwright-core';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const CHROME_H = 103; // keep in step with --spacing-chrome in app/globals.css

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

const wrapper = 'div[data-stuck]';
const navSel = 'nav[aria-label="Product categories"]';

// ---------- home, desktop ----------
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(600);

const masthead = page.locator('header > div').first();
const stuck = () => page.locator(wrapper).getAttribute('data-stuck');
const mastheadH = async () => Math.round((await masthead.boundingBox()).height);

check('at rest: not pinned', await stuck(), 'false');
check('at rest: masthead 72px', await mastheadH(), 72);

await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(500);

check('scrolled: pinned', await stuck(), 'true');
check(
  'scrolled: wrapper sits on the viewport top',
  await page.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().top), wrapper),
  0,
);
check('scrolled: masthead condenses to 58px', await mastheadH(), 58);
check(
  'scrolled: pinned height matches --spacing-chrome',
  await page.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().height), wrapper),
  CHROME_H,
);
check(
  'scrolled: --spacing-chrome token',
  await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--spacing-chrome').trim()),
  `${CHROME_H}px`,
);
check(
  'scrolled: category row is fully on screen',
  await page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return r.top >= 0 && r.bottom <= 110;
  }, navSel),
  'true',
);

// The hover panel is absolute inside the nav, so pinning must not strand it off-screen.
await page.locator(`${navSel} a[href^="/c/"]`).first().hover();
await page.waitForTimeout(400);
check(
  'pinned: category panel opens directly under the row',
  await page.evaluate((s) => {
    const panel = document.querySelector(`${s} > div:last-child`);
    const r = panel?.getBoundingClientRect();
    return !!r && r.height > 120 && r.top > 95 && r.top < 115;
  }, navSel),
  'true',
);

await page.mouse.move(700, 600);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
check('back at top: unpinned again', await stuck(), 'false');

// ---------- card rating: stars, no numeral ----------
// Read off a category grid: the home page opens on the deal rail, whose cards carry a claimed
// meter instead of a rating.
const plp = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await plp.goto(`${BASE}/c/sleep`, { waitUntil: 'networkidle', timeout: 60000 });
await plp.waitForTimeout(500);

check(
  'card: stars present',
  await plp.evaluate(() => {
    const card = document.querySelector('article a[href^="/p/"]')?.closest('article');
    return !!card?.querySelector('[role="img"][aria-label^="Rated"]');
  }),
  'true',
);
check(
  'card: no numeric average beside the stars',
  await plp.evaluate(() => {
    const cards = [...document.querySelectorAll('article')];
    return cards.reduce(
      (n, card) =>
        n + [...card.querySelectorAll('span')].filter((el) => /^[0-5]\.\d$/.test(el.textContent.trim())).length,
      0,
    );
  }),
  0,
);

// ---------- PDP: sticky buy box and anchor offsets ----------
const slug = await plp.locator('article a[href^="/p/"]').first().getAttribute('href');
const pdp = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await pdp.goto(`${BASE}${slug}`, { waitUntil: 'networkidle', timeout: 60000 });
await pdp.waitForTimeout(500);

check(
  'PDP: summary column keeps its numeric average',
  await pdp.evaluate(() => {
    const row = document.querySelector('a[href="#reviews"]')?.parentElement;
    return [...(row?.children ?? [])].some((el) => /^[0-5]\.\d$/.test(el.textContent.trim()));
  }),
  'true',
);

// Pinned at 119px (chrome + 1rem) while inside its range — the summary column is shorter than
// the buy box, so that range ends well before the fold; 450px is inside it.
await pdp.evaluate(() => window.scrollTo(0, 450));
await pdp.waitForTimeout(500);
check(
  'PDP: pinned buy box clears the chrome',
  await pdp.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(
      (d) => typeof d.className === 'string' && d.className.includes('xl:sticky'),
    );
    return Math.round(el.getBoundingClientRect().top);
  }),
  CHROME_H + 16,
);

await pdp.evaluate(() => window.scrollTo(0, 0));
await pdp.waitForTimeout(300);
await pdp.locator('a[href="#reviews"]').first().click();
await pdp.waitForTimeout(900);
check(
  'PDP: #reviews lands below the chrome, not under it',
  await pdp.evaluate((h) => {
    const top = Math.round(document.querySelector('#reviews').getBoundingClientRect().top);
    return top >= h && top <= h + 40;
  }, CHROME_H),
  'true',
);

// ---------- mobile ----------
const mobile = await browser.newPage({ ...devices['iPhone 13'] });
await mobile.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await mobile.waitForTimeout(500);
const visible = (sel) => mobile.evaluate((s) => !!document.querySelector(s)?.getClientRects().length, sel);
const ICON = 'a[href="/search"][aria-label="Search supplements"]';

check('mobile at rest: search row shown', await visible('#site-search-mobile'), 'true');
check('mobile at rest: search icon shown', await visible(ICON), 'true');

await mobile.evaluate(() => window.scrollTo(0, 1400));
await mobile.waitForTimeout(600);
check('mobile pinned: search row folded away', await visible('#site-search-mobile'), 'false');
check('mobile pinned: search icon still reachable', await visible(ICON), 'true');
check(
  'mobile pinned: chrome stays at 103px',
  await mobile.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().height), wrapper),
  CHROME_H,
);
check(
  'mobile: no horizontal overflow',
  await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  'true',
);

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
