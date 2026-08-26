// Temporary PDP check: structure assertions plus desktop/mobile screenshots.
// Usage: node reference/pdp-check.mjs   (needs the dev server on :3000)
//        BASE_URL=http://localhost:42286 node reference/pdp-check.mjs   (when dev picked another port)
import { chromium, devices } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'reference/preview';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const MAIN = '/p/now-foods-magnesium-glycinate-180-tablets-100-mg-per-tablet';
const SIBLINGS = '/p/now-foods-omega-3-fish-oil-1-000-mg-200-softgels';

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', (e) => results.push(`FAIL  page error: ${e.message}`));
await page.goto(`${BASE}${MAIN}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);

check('h1 present', await page.locator('h1').count(), 1);
check('product information section', await page.locator('#product-information').count(), 1);
check('supplement facts table', await page.locator('#product-information table').count(), 1);
check(
  'info section headings',
  await page.locator('#product-information h3').allInnerTexts().then((t) => t.join('|')),
  'Overview|Specifications|Suggested use|Other ingredients|Warnings|Storage|DISCLAIMER',
);
// %DV comes off the manufacturer's label now, so the panel must show a real percentage
check(
  'supplement facts carry a real %DV',
  await page.locator('#product-information table tbody tr:last-child td:last-child').innerText(),
  '48%',
);
// three at-a-glance panels: key info, certifications and diet, quality standards
check('at-a-glance panels', await page.locator('section[aria-label="Product at a glance"] h2').count(), 3);
check(
  'certifications read from the label',
  await page
    .locator('section[aria-label="Product at a glance"] li span.text-\\[13px\\]')
    .allInnerTexts()
    .then((t) => t.slice(0, 4).join('|')),
  'Vegetarian|Vegan|Kosher|Halal',
);
check('no facts panel left in hero', await page.locator('h2:text-is("Product facts")').count(), 0);
check('rankings block', await page.locator('section[aria-label="Product rankings"]').count(), 1);
check('similar item', await page.locator('section[aria-label="A similar item"]').count(), 1);
check('stars rendered', await page.locator('[role="img"][aria-label^="Rated"]').count() > 0, true);
// the cross-sell rail sits above the descriptive section, not below it
check(
  'pairs well with precedes product information',
  await page.evaluate(() => {
    const info = document.querySelector('#product-information');
    const rail = [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === 'Pairs well with');
    return !!(info && rail) && !!(rail.compareDocumentPosition(info) & Node.DOCUMENT_POSITION_FOLLOWING);
  }),
  true,
);

// gallery: one radio and one thumbnail per published shot, first shot selected, no client JS
check('gallery thumbnails', await page.locator('.gallery .thumbs li').count(), 4);
check('gallery starts on the first shot', await page.locator('.gallery > input:checked').count(), 1);
check(
  'gallery switches shot on click',
  await (async () => {
    await page.locator('.gallery .thumbs li:nth-child(3) label').click();
    await page.waitForTimeout(250);
    return page.locator('.gallery .frame > div:nth-child(3)').evaluate((el) => getComputedStyle(el).opacity);
  })(),
  '1',
);

// gallery zoom: hovering the shot on screen opens a pane beside the frame showing the region
// under the lens, panning follows the pointer, and leaving clears both. Replaced a whole-image
// `scale(1.08)` on the frame, so assert nothing transforms any more either.
const activeShot = page.locator('.gallery .frame > div:nth-child(3) .cursor-crosshair');
const shotBox = await activeShot.boundingBox();
const frameBox = await page.locator('.gallery .frame').boundingBox();
await page.mouse.move(shotBox.x + shotBox.width * 0.5, shotBox.y + shotBox.height * 0.6, { steps: 6 });
await page.waitForTimeout(500);
const pane = page.locator('[data-zoom-pane]:visible');
check('zoom pane opens on hover', await pane.count(), 1);
check(
  'zoom pane sits beside the frame',
  await pane.boundingBox().then((b) => b.x >= frameBox.x + frameBox.width),
  true,
);
check(
  'zoom shows the source at its own resolution',
  await pane.evaluate((el) => getComputedStyle(el).backgroundSize),
  '900px 900px',
);
check('zoom lens drawn over the shot', await activeShot.locator('> span').count(), 1);
const firstPos = await pane.evaluate((el) => getComputedStyle(el).backgroundPosition);
await page.mouse.move(shotBox.x + shotBox.width * 0.25, shotBox.y + shotBox.height * 0.25, { steps: 6 });
await page.waitForTimeout(300);
check(
  'zoom pans with the pointer',
  (await pane.evaluate((el) => getComputedStyle(el).backgroundPosition)) !== firstPos,
  true,
);
check(
  'gallery image carries no hover transform',
  await page.locator('.gallery .frame img').first().evaluate((el) => getComputedStyle(el).transform),
  'none',
);
await page.mouse.move(shotBox.x + shotBox.width / 2, shotBox.y - 80, { steps: 6 });
await page.waitForTimeout(300);
check('zoom clears on leave', await page.locator('[data-zoom-pane]').count(), 0);

// the buy box: stepper + add to cart must still work
const buy = page.locator('section[aria-label="Purchase options"]');
check('buy box present', await buy.count(), 1);
await buy.locator('button[aria-label="Increase quantity"]').click();
await page.waitForTimeout(200);
check('stepper reaches 2', (await buy.locator('[aria-live="polite"]').innerText()).trim(), '2');
await buy.locator('button', { hasText: 'Add to cart' }).first().click();
await page.waitForTimeout(600);
check(
  'cart takes both units',
  await page.locator('[aria-label^="Cart"]').first().getAttribute('aria-label'),
  'Cart, 2 items',
);

// green must be gone from the page's own chrome: no pandan token outside the shared product
// cards in the rail, which are sitewide furniture and keep the site's trust green for now
const greens = await page.evaluate(() => {
  const pandan = ['rgb(22, 74, 52)', 'rgb(30, 91, 65)', 'rgb(230, 240, 234)'];
  const hits = [];
  for (const el of document.querySelectorAll('main *')) {
    if (el.closest('article')) continue;
    const s = getComputedStyle(el);
    for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'fill']) {
      if (pandan.includes(s[prop])) hits.push(`${el.tagName}.${el.className}:${prop}`);
    }
  }
  return hits.slice(0, 6);
});
check('no pandan green in PDP chrome', greens.length, 0);
if (greens.length) results.push(`      ${greens.join(', ')}`);

// add-to-cart: the gradient orange, white label, and no per-serving figure anywhere on the page
const addButton = buy.locator('button', { hasText: 'Add to cart' }).first();
const add = await addButton.evaluate((el) => {
  const s = getComputedStyle(el);
  return { bg: s.backgroundColor, image: s.backgroundImage, color: s.color, radius: s.borderTopLeftRadius };
});
check('add-to-cart base fill', add.bg, 'rgb(188, 85, 0)');
check('add-to-cart is a gradient', add.image.startsWith('linear-gradient(rgb(192, 109, 0)'), true);
check('add-to-cart label is white', add.color, 'rgb(255, 255, 255)');
check('add-to-cart radius', add.radius, '3px');
check('no per-serving figure on the page', (await page.locator('main').innerText()).includes('/serving'), false);
check('no fabricated lot-test claim', (await page.locator('main').innerText()).includes('test results published'), false);

// stars are the one yellow, and the product page pair runs at 18px
const starFill = await page
  .locator('[role="img"][aria-label^="Rated"] span[style*="width"] span')
  .first()
  .evaluate((el) => getComputedStyle(el).color);
check('stars are yellow', starFill, 'rgb(245, 166, 35)');

await page.close();

// screenshots on a clean page, so the cart drawer opened by the click test is not in shot
const shot = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await shot.goto(`${BASE}${MAIN}`, { waitUntil: 'networkidle', timeout: 60000 });
await shot.waitForTimeout(900);
await shot.screenshot({ path: `${OUT}/pdp-new-top.png` });
await shot.evaluate(() => document.querySelector('#product-information')?.scrollIntoView());
await shot.waitForTimeout(500);
await shot.screenshot({ path: `${OUT}/pdp-new-info.png` });
await shot.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await shot.waitForTimeout(500);
await shot.screenshot({ path: `${OUT}/pdp-new-foot.png` });
await shot.close();

// pack tiles only appear where the catalog has more than one size
const sib = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await sib.goto(`${BASE}${SIBLINGS}`, { waitUntil: 'networkidle', timeout: 60000 });
await sib.waitForTimeout(600);
check('pack tiles on multi-size product', await sib.locator('section[aria-label="Package quantity"] li').count(), 3);
check('current size marked', await sib.locator('[aria-current="true"]').count(), 1);
await sib.close();

const mobile = await browser.newPage({ ...devices['Pixel 7'] });
await mobile.goto(`${BASE}${MAIN}`, { waitUntil: 'networkidle', timeout: 60000 });
await mobile.waitForTimeout(800);
check('mobile: no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
await mobile.screenshot({ path: `${OUT}/pdp-new-mobile.png`, fullPage: true });
await mobile.close();

await browser.close();
console.log(results.join('\n'));
console.log(results.some((r) => r.startsWith('FAIL')) ? 'FAILURES' : 'ALL PASS');
