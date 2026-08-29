// Assertions for the masthead search field: the prediction panel from `sm` up, the phone sheet
// below it, and the relevance fix underneath both. Run with the dev server up:
//   node reference/search-check.mjs
//   BASE_URL=http://localhost:3001 node reference/search-check.mjs   (when dev picked another port)
//
// What it holds to: typing opens a panel of real destinations, every product row carries a price and
// a /p/ slug, `vitamin d` no longer returns collagen, the keyboard drives the listbox through
// aria-activedescendant with focus left in the input, a typo is offered a correction, a refinement
// lands on a page that is not empty, the phone gets a full-screen sheet with no sideways scroll, and
// the field still submits to /search with JavaScript off.
import { chromium, devices } from 'playwright-core';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

const FIELD = '#site-search';
const LIST = '#search-field-listbox';
const OPTION = `${LIST} [role="option"]`;
const SHEET = '#search-sheet';
const SHEET_FIELD = '#site-search-sheet';
const SHEET_OPTION = '#search-sheet-listbox [role="option"]';

// Debounce is 120ms and the endpoint answers in ~10ms; 500 leaves room on a cold route.
const type = async (page, text) => {
  await page.fill(FIELD, text);
  await page.waitForTimeout(500);
};

const rowText = (page, selector = OPTION) =>
  page.$$eval(selector, (rows) => rows.map((row) => row.innerText.replace(/\s+/g, ' ').trim()));

const productText = (page) =>
  page.$$eval(OPTION, (rows) =>
    rows
      .filter((row) => (row.getAttribute('href') ?? '').startsWith('/p/'))
      .map((row) => row.innerText.replace(/\s+/g, ' ').trim()),
  );

const overflows = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// ---------- desktop: the panel opens, and what it offers is real ----------
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(400);

check('closed: no options in the listbox', await page.locator(OPTION).count(), 0);
check('closed: listbox is not visible', await page.locator(LIST).isVisible(), false);
check('closed: aria-expanded is false', await page.locator(FIELD).getAttribute('aria-expanded'), 'false');

await type(page, 'vitamin');
check('typed "vitamin": panel has rows', (await page.locator(OPTION).count()) > 0, 'true');
check('typed "vitamin": aria-expanded is true', await page.locator(FIELD).getAttribute('aria-expanded'), 'true');
check(
  'typed "vitamin": every row is a link with a local href',
  await page.$$eval(OPTION, (rows) => rows.every((row) => (row.getAttribute('href') ?? '').startsWith('/'))),
  'true',
);

const products = await productText(page);
check('typed "vitamin": product rows exist', products.length > 0, 'true');
check(
  'typed "vitamin": every product row prints a baht price',
  products.every((text) => /฿[\d,]+\.\d\d/.test(text)),
  'true',
);

// ---------- the regression the ranking fix exists for ----------
await type(page, 'vitamin d');
check(
  'typed "vitamin d": no collagen row anywhere in the panel',
  (await rowText(page)).some((text) => /collagen/i.test(text)),
  'false',
);
check(
  'typed "vitamin d": the first product row is a vitamin D product',
  /vitamin d|d3/i.test((await productText(page))[0] ?? ''),
  'true',
);

// ---------- keyboard: the input keeps focus, the listbox moves ----------
await page.locator(FIELD).press('ArrowDown');
await page.locator(FIELD).press('ArrowDown');
await page.waitForTimeout(150);
const active = await page.locator(FIELD).getAttribute('aria-activedescendant');
check('two ArrowDowns: aria-activedescendant is the second row', active, await page.locator(OPTION).nth(1).getAttribute('id'));
check(
  'two ArrowDowns: that row is the selected option',
  await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-selected'), active),
  'true',
);
check(
  'two ArrowDowns: exactly one row is selected',
  await page.$$eval(OPTION, (rows) => rows.filter((row) => row.getAttribute('aria-selected') === 'true').length),
  1,
);
check('two ArrowDowns: focus stays in the input', await page.evaluate(() => document.activeElement?.id), 'site-search');

// A row's href is written with `+` for a space and `router.push` writes `%20`, so the query string is
// compared parameter by parameter rather than as text.
const params = (url) =>
  [...url.searchParams].map(([key, value]) => `${key}=${value}`).sort().join('&');

const second = new URL(await page.locator(OPTION).nth(1).getAttribute('href'), BASE);
await page.locator(FIELD).press('Enter');
// `/c/[slug]` may still be compiling on a cold dev server, so wait on the URL rather than a timeout.
await page.waitForURL((url) => url.pathname === second.pathname, { timeout: 20000 }).catch(() => {});
const landed = new URL(page.url());
check('Enter follows the active row', landed.pathname, second.pathname);
check("Enter carries the row's parameters", params(landed), params(second));

// ---------- wrapping, and the two jobs of Escape ----------
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await type(page, 'mag');
await page.locator(FIELD).press('ArrowUp');
await page.waitForTimeout(150);
check(
  'ArrowUp from the top wraps to the last row',
  await page.locator(FIELD).getAttribute('aria-activedescendant'),
  await page.locator(OPTION).last().getAttribute('id'),
);

await page.locator(FIELD).press('Escape');
await page.waitForTimeout(200);
check('Escape closes the panel', await page.locator(LIST).isVisible(), false);
check('Escape leaves focus in the input', await page.evaluate(() => document.activeElement?.id), 'site-search');
check('Escape keeps the typed query', await page.inputValue(FIELD), 'mag');
await page.locator(FIELD).press('Escape');
await page.waitForTimeout(200);
check('a second Escape clears the field', await page.inputValue(FIELD), '');

// ---------- a refinement row lands on a filtered page that holds stock ----------
await type(page, 'mag');
const refine = await page.$$eval(OPTION, (rows) =>
  rows.map((row) => row.getAttribute('href')).find((href) => href.startsWith('/c/') && href.includes('refine=')),
);
check('a refinement row links to /c/<slug>?refine=…', typeof refine === 'string', 'true');
await page.goto(`${BASE}${refine}`, { waitUntil: 'networkidle', timeout: 60000 });
check('that refinement page is not empty', (await page.locator('a[href^="/p/"]').count()) > 0, 'true');

// ---------- the panel previews what the results page delivers ----------
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await type(page, 'whey isolate');
const firstProduct = await page.locator(`${OPTION}[href^="/p/"]`).first().getAttribute('href');
await page.locator(FIELD).press('Enter');
await page.waitForTimeout(1500);
check('submitting lands on the results page', new URL(page.url()).pathname, '/search');
check('submitting carries the query', new URL(page.url()).searchParams.get('q'), 'whey isolate');
check(
  "the panel's first product is the results page's first card",
  await page.locator('a[href^="/p/"]').first().getAttribute('href'),
  firstProduct,
);

// ---------- recent searches ----------
await page.fill(FIELD, '');
await page.locator(FIELD).click();
await page.waitForTimeout(500);
check(
  'an empty field offers the query just searched for',
  (await rowText(page)).includes('whey isolate'),
  'true',
);
check(
  'and labels it Recent searches',
  // `kicker` uppercases the heading, and innerText reports what is rendered.
  await page.$eval(LIST, (list) => /recent searches/i.test(list.innerText)),
  'true',
);

// ---------- a typo, and a query nothing matches ----------
await type(page, 'zink');
const guess = await page.$$eval(OPTION, (rows) =>
  rows.map((row) => ({ text: row.innerText.replace(/\s+/g, ' ').trim(), href: row.getAttribute('href') })),
);
check('typed "zink": a did-you-mean row leads the panel', /did you mean zinc/i.test(guess[0]?.text ?? ''), 'true');
check('typed "zink": it links to zinc', /zinc/i.test(guess[0]?.href ?? ''), 'true');

await type(page, 'xyzzy');
check('typed "xyzzy": no rows at all', await page.locator(OPTION).count(), 0);
check('typed "xyzzy": no stale panel left open', await page.locator(LIST).isVisible(), false);

// ---------- the panel hangs under the field and inside the shell, at every width above sm ----------
for (const width of [768, 1024, 1440]) {
  const wide = await browser.newPage({ viewport: { width, height: 900 } });
  await wide.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await type(wide, 'vitamin d');
  const geometry = await wide.evaluate(
    ([f, l]) => {
      const field = document.querySelector(f).getBoundingClientRect();
      const list = document.querySelector(l);
      // The panel is the bordered shell; the listbox inside it is inset by that 1px border.
      const box = list.parentElement.getBoundingClientRect();
      return {
        under: Math.round(box.top - field.bottom),
        aligned: Math.round(box.left - field.left),
        width: Math.round(box.width - field.width),
        inside: box.right <= window.innerWidth + 1 && box.left >= -1,
        tall: list.getBoundingClientRect().height > 100,
      };
    },
    [FIELD, LIST],
  );
  check(`${width}px: panel hangs just under the field`, geometry.under >= 0 && geometry.under <= 8, 'true');
  check(`${width}px: panel is aligned with the field`, geometry.aligned, 0);
  check(`${width}px: panel matches the width of the field`, geometry.width, 0);
  check(`${width}px: panel stays inside the viewport`, geometry.inside, 'true');
  check(`${width}px: panel has room for rows`, geometry.tall, 'true');
  check(`${width}px: no horizontal overflow with the panel open`, await overflows(wide), 'true');
  await wide.close();
}

// ---------- the phone sheet ----------
const phone = await browser.newPage({ ...devices['iPhone 13'] });
await phone.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await phone.waitForTimeout(400);
// The inline field stays in the markup below `sm` (it is `hidden sm:block`), so what matters is that
// it is not on screen and the phone reaches search through the row and the sheet instead.
check('phone: the inline field is not shown', await phone.locator(FIELD).isVisible(), false);
check('phone at rest: no horizontal overflow', await overflows(phone), 'true');

await phone.locator('#site-search-mobile').click();
await phone.waitForTimeout(400);
check('phone: pressing the row opens the sheet', await phone.locator(SHEET).isVisible(), true);
check(
  'phone: the sheet fills the viewport',
  await phone.evaluate((s) => {
    const box = document.querySelector(s).getBoundingClientRect();
    return (
      Math.round(box.top) === 0 &&
      Math.round(box.left) === 0 &&
      Math.round(box.width) === window.innerWidth &&
      Math.round(box.height) === window.innerHeight
    );
  }, SHEET),
  'true',
);
check(
  'phone: focus moves to the sheet field',
  await phone.evaluate(() => document.activeElement?.id),
  'site-search-sheet',
);
check(
  'phone: the sheet field is 16px, so iOS does not zoom the page',
  await phone.evaluate((s) => getComputedStyle(document.querySelector(s)).fontSize, SHEET_FIELD),
  '16px',
);
check('phone: the page behind cannot scroll', await phone.evaluate(() => document.body.style.overflow), 'hidden');

await phone.fill(SHEET_FIELD, 'vitamin d');
await phone.waitForTimeout(500);
check('phone: the sheet offers rows', (await phone.locator(SHEET_OPTION).count()) > 0, 'true');
check('phone: no horizontal overflow with the sheet open', await overflows(phone), 'true');

await phone.locator(SHEET_FIELD).press('Escape');
await phone.waitForTimeout(400);
check('phone: Escape closes the sheet', await phone.locator(SHEET).count(), 0);
check('phone: page scrolling is restored', await phone.evaluate(() => document.body.style.overflow), '');
check('phone: no horizontal overflow once closed', await overflows(phone), 'true');

// ---------- with JavaScript off, the field is still a form ----------
const plain = await browser.newPage({ viewport: { width: 1440, height: 950 }, javaScriptEnabled: false });
await plain.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
check('no JS: the field is rendered', await plain.locator(FIELD).count(), 1);
check('no JS: nothing is expanded', await plain.locator(OPTION).count(), 0);
await plain.fill(FIELD, 'magnesium');
await plain.locator(FIELD).press('Enter');
await plain.waitForTimeout(1500);
check('no JS: Enter submits to /search', new URL(plain.url()).pathname, '/search');
check('no JS: the query arrives', new URL(plain.url()).searchParams.get('q'), 'magnesium');
check('no JS: that page holds products', (await plain.locator('a[href^="/p/"]').count()) > 0, 'true');
await plain.close();

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
