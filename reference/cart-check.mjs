// The whole buy flow: card -> drawer -> /cart -> /checkout -> order row -> confirmation.
//
// WRITES TO THE DATABASE. Like auth-check.mjs, run it against a scratch Neon project, not the real
// one: it places a real order and then deletes it, but a failure part-way through can leave the row
// behind. It prints the order number it created so you can find it.
//
//   node reference/cart-check.mjs
//   BASE_URL=http://localhost:3100 node reference/cart-check.mjs
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SLUG = 'now-foods-vitamin-d3-k2-120-capsules';
const EMAIL = 'cart-check@slimwellness.test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  process.loadEnvFile(path.join(root, '.env.local'));
} catch {
  // fall through to whatever is already in the environment
}

const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

const browser = await chromium.launch({ executablePath: EXE, headless: true });
// domcontentloaded, not networkidle: prefetches on a page with many links need not settle.
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
let orderNo = null;

// ---------- add from the product page, and check the drawer ----------
await page.goto(`${BASE}/p/${SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.click('section[aria-label="Purchase options"] button.btn-cart');
await page.waitForTimeout(600);

const drawer = page.locator('[role="dialog"][aria-label="Cart"]');
check('drawer opens on add', await drawer.count(), 1);
check('drawer offers a progress bar', await drawer.locator('[role="progressbar"]').count(), 1);
check('drawer links to the cart page', await drawer.locator('a[href="/cart"]').count(), 1);
check('drawer links to checkout', await drawer.locator('a[href="/checkout"]').count(), 1);

// ---------- the cart page ----------
await page.click('[role="dialog"][aria-label="Cart"] a[href="/cart"]');
await page.waitForURL('**/cart', { timeout: 30000 });
await page.waitForTimeout(1400);

check('cart: one line', await page.locator('main ul li').filter({ has: page.locator('a[href^="/p/"]') }).count() > 0, 'true');
check('cart: progress bar', await page.locator('[role="progressbar"]').count(), 1);
check('cart: an arrival window is quoted', /arrives|delivery/i.test(await page.locator('main').innerText()), 'true');
check('cart: cross-sell rail', /frequently added/i.test(await page.locator('main').innerText()), 'true');

// ---------- checkout ----------
await page.click('a[href="/checkout"]');
await page.waitForURL('**/checkout', { timeout: 30000 });
await page.waitForTimeout(1600);

check('checkout: three sections', await page.locator('form section[aria-label]').count(), 3);
check('checkout: a delivery method is offered', await page.locator('input[name="delivery"]').count() >= 1, 'true');
check('checkout: a payment method is offered', await page.locator('input[name="payment"]').count() >= 1, 'true');
check('checkout: no card number field', await page.locator('input[autocomplete="cc-number"]').count(), 0);
check(
  'checkout: no price is posted',
  await page.locator('input[type="hidden"][name="item"]').first().getAttribute('value'),
  `${SLUG}:1`,
);

// Rejecting the form must keep it on the page rather than losing what was typed.
await page.fill('input[name="email"]', 'not-an-address');
await page.fill('input[name="name"]', 'Cart Check');
await page.fill('input[name="phone"]', '0812345678');
await page.fill('input[name="line"]', '1 Test Road');
await page.fill('input[name="subdistrict"]', 'Khlong Toei Nuea');
await page.fill('input[name="district"]', 'Watthana');
await page.fill('input[name="postcode"]', '10110');
await page.click('button:has-text("Place order")');
await page.waitForTimeout(1500);
check('checkout: a bad address is rejected here', page.url().includes('/checkout'), 'true');
check('checkout: the name survives the rejection', await page.inputValue('input[name="name"]'), 'Cart Check');

// ---------- place it ----------
await page.fill('input[name="email"]', EMAIL);
await page.click('button:has-text("Place order")');
await page.waitForURL('**/checkout/confirmation/**', { timeout: 45000 });
await page.waitForTimeout(1600);

orderNo = page.url().split('/').pop();
check('order number looks like ours', /^SWA-\d{2}-\d{4}$/.test(orderNo ?? ''), 'true');

const confirmation = await page.locator('main').innerText();
check('confirmation: quotes the number', confirmation.includes(orderNo ?? '#'), 'true');
check('confirmation: quotes the address', /1 Test Road/.test(confirmation), 'true');
check('confirmation: says what happens next', /courier|transfer|promptpay/i.test(confirmation), 'true');

// ---------- the cart is emptied ----------
await page.goto(`${BASE}/cart`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1400);
check('cart is emptied by the confirmation', /your cart is empty/i.test(await page.locator('main').innerText()), 'true');

// ---------- the row, and its snapshot ----------
if (process.env.DATABASE_URL) {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: !process.env.DATABASE_URL.includes('localhost'),
  });
  await client.connect();

  const { rows } = await client.query(
    `select o.order_no, o.total, o.subtotal, o.delivery_fee, o.user_id,
            i.title, i.brand, i.unit_price, i.qty
       from orders o join order_items i on i.order_id = o.id
      where o.order_no = $1`,
    [orderNo],
  );

  check('one line was written', rows.length, 1);
  if (rows[0]) {
    check('the line snapshots a title', rows[0].title.length > 0, 'true');
    check('the line snapshots a brand', rows[0].brand, 'NOW Foods');
    check('total is subtotal plus delivery', rows[0].total, rows[0].subtotal + rows[0].delivery_fee);
    check('placed as a guest', rows[0].user_id, null);
  }

  await client.query('delete from orders where email = $1', [EMAIL]);
  const { rows: left } = await client.query('select 1 from orders where email = $1', [EMAIL]);
  check('the test order was removed again', left.length, 0);
  await client.end();
} else {
  results.push('SKIP  database checks: DATABASE_URL is not set');
}

await page.close();
await browser.close();

console.log(results.join('\n'));
if (orderNo) console.log(`\norder created (and deleted): ${orderNo}`);
const ok = results.every((r) => r.startsWith('PASS') || r.startsWith('SKIP'));
console.log(ok ? 'all checks passed' : 'SOME CHECKS FAILED');
process.exitCode = ok ? 0 : 1;
