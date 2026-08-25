// Interaction check for the hover-reveal add-to-cart. Run with the dev server up:
//   node reference/interact.mjs
import { chromium, devices } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'reference/preview';
const URL = 'http://localhost:3000/c/sleep';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

// ---------- pointer device ----------
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const card = page.locator('article').first();
const button = card.locator('button', { hasText: 'Add to cart' });
const opacity = () => button.evaluate((el) => getComputedStyle(el).opacity);
const events = () => button.evaluate((el) => getComputedStyle(el).pointerEvents);

check('hidden at rest (opacity)', await opacity(), '0');
check('not clickable at rest', await events(), 'none');

await card.hover();
await page.waitForTimeout(300);
check('revealed on hover (opacity)', await opacity(), '1');
check('clickable on hover', await events(), 'auto');
await page.screenshot({ path: `${OUT}/hover-desktop.png` });

const before = page.url();
await button.click();
await page.waitForTimeout(500);
check('click did not navigate', page.url(), before);
check(
  'cart shows 1 item',
  await page.locator('[aria-label^="Cart"]').first().getAttribute('aria-label'),
  'Cart, 1 item',
);
await page.screenshot({ path: `${OUT}/hover-added.png` });

// keyboard: focus inside the card should reveal it too
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.mouse.move(0, 0);
await card.locator('a').first().focus();
await page.waitForTimeout(300);
check('revealed on keyboard focus', await opacity(), '1');
await page.close();

// ---------- touch device (no hover) ----------
const touch = await browser.newPage({ ...devices['Pixel 7'] });
await touch.goto(URL, { waitUntil: 'networkidle' });
await touch.waitForTimeout(800);
const touchButton = touch.locator('article').first().locator('button', { hasText: 'Add to cart' });
check(
  'visible at rest on touch',
  await touchButton.evaluate((el) => getComputedStyle(el).opacity),
  '1',
);
await touch.screenshot({ path: `${OUT}/hover-touch.png` });
await touch.close();

await browser.close();
console.log(results.join('\n'));
console.log(results.every((r) => r.startsWith('PASS')) ? '\nall checks passed' : '\nSOME CHECKS FAILED');
