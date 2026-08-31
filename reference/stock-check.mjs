// Out-of-stock handling, everywhere it shows. Read-only — nothing here writes to the database, so
// it is safe against the real project. Run with the dev server up:
//   node reference/stock-check.mjs
//   BASE_URL=http://localhost:3100 node reference/stock-check.mjs
//
// The bug this exists to keep fixed: buy-box.tsx did not read `product.inStock`, so an unavailable
// product showed "In stock, packed in Bangkok" and a live Add to cart beside a summary line reading
// "Out of stock", and the card's quick-add would put it in the cart.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// One of the twelve the catalogue marks unavailable, and its shelf.
const OUT_OF_STOCK = 'megafood-daily-immune-support-60-tablets';
const SHELF = '/c/immunity';

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

// ---------- the product page ----------
await page.goto(`${BASE}/p/${OUT_OF_STOCK}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);

const buyBox = page.locator('section[aria-label="Purchase options"]');
// innerText, never textContent: textContent also reads the RSC flight data Next embeds in script
// tags, so "is it gone" would false-pass. Same trap as auth-check.mjs.
const buyBoxText = await buyBox.innerText();

check('PDP: buy box says out of stock', /out of stock/i.test(buyBoxText), 'true');
check('PDP: buy box does not claim in stock', /in stock, packed/i.test(buyBoxText), 'false');
check('PDP: no add-to-cart in the buy box', await buyBox.locator('button.btn-cart').count(), 0);
check('PDP: no quantity stepper', await buyBox.locator('[aria-label="Increase quantity"]').count(), 0);
check('PDP: a restock form is offered', await buyBox.locator('input[name="email"]').count(), 1);
check(
  'PDP: summary and buy box agree',
  /out of stock/i.test(await page.locator('main').innerText()),
  'true',
);

// ---------- the card on its shelf ----------
await page.goto(`${BASE}${SHELF}?stock=1`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const filteredHasIt = await page.locator(`article a[href="/p/${OUT_OF_STOCK}"]`).count();
check('shelf: "in stock only" hides it', filteredHasIt, 0);

await page.goto(`${BASE}${SHELF}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const card = page.locator('article').filter({ has: page.locator(`a[href="/p/${OUT_OF_STOCK}"]`) });
check('shelf: the card is listed unfiltered', await card.count(), 1);
check('card: says out of stock', /out of stock/i.test(await card.innerText()), 'true');
check('card: offers no add', await card.locator('button', { hasText: 'Add to cart' }).count(), 0);

// ---------- the cart refuses it ----------
const refused = await page.evaluate(async (slug) => {
  window.localStorage.setItem('swa.cart.v1', JSON.stringify([{ slug, qty: 1 }]));
  return window.localStorage.getItem('swa.cart.v1');
}, OUT_OF_STOCK);
check('a stale line can be planted', refused !== null, 'true');

await page.goto(`${BASE}/cart`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1400);
const cartText = await page.locator('main').innerText();
check('cart: the stale line is shown, not deleted', /no longer available/i.test(cartText), 'true');
check('cart: it is not in the subtotal', /฿0\.00/.test(cartText), 'true');
check(
  'cart: checkout is not offered',
  await page.locator('a[href="/checkout"]:not([aria-disabled="true"])').count(),
  0,
);

await page.evaluate(() => window.localStorage.removeItem('swa.cart.v1'));
await page.close();
await browser.close();

console.log(results.join('\n'));
console.log(results.every((r) => r.startsWith('PASS')) ? '\nall checks passed' : '\nSOME CHECKS FAILED');
process.exitCode = results.every((r) => r.startsWith('PASS')) ? 0 : 1;
