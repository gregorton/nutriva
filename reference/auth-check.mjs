// End-to-end check for accounts, reviews and saved items. Needs the dev server up and
// DATABASE_URL set, and it writes to the database — point it at a scratch project, not a real one:
//
//   node reference/db/migrate.mjs
//   node reference/auth-check.mjs
//
// It signs up a throwaway account each run (the email carries a timestamp) and deletes it at the
// end, which takes its session, review and saved row with it via the cascades.
//
// Navigation waits on `domcontentloaded` plus an explicit pause, not `networkidle`: the footer
// links to a few routes that do not exist yet, and their prefetches never settle, so a
// network-idle wait times out on every page rather than telling us anything about this feature.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import pg from 'pg';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'reference/preview';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
mkdirSync(OUT, { recursive: true });

try {
  process.loadEnvFile('.env.local');
} catch {
  // fall through to the ambient environment
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — this check writes to the database.');
  process.exit(1);
}

// A real slug off the catalogue, so the check cannot rot when the catalogue is refreshed.
const catalog = JSON.parse(readFileSync('lib/catalog.generated.json', 'utf8'));
const target = catalog.items.find((item) => item.inStock);
const PDP = `${BASE}/p/${target.slug}`;

const stamp = Date.now();
const EMAIL = `check-${stamp}@nutriva.test`;
const NAME = `Checker ${stamp}`;
const PASSWORD = 'nutriva123';
const HEADLINE = `Automated check ${stamp}`;
const BODY = 'Written by reference/auth-check.mjs to prove the review round trip works end to end.';

// The masthead search button is also type=submit and precedes the form in the DOM.
const AUTH_SUBMIT = 'form:has(#auth-password) button[type=submit]';

// textContent('body') also reads the RSC flight data Next embeds in <script> tags, which keeps
// the pre-mutation payload and turns 'is it gone from the page' into a false pass. innerText
// sees rendered text only.
const visibleText = () => page.innerText('body');

const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};
const checkThat = (label, condition, detail = '') => {
  results.push(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail && !condition ? `: ${detail}` : ''}`);
};

// Opened up front, because the per-star assertion is checked against the table rather than
// against an earlier reading of the page. A previous run that deleted its rows in SQL rather
// than through the app left the cached page counting reviews that no longer exist, which is
// correct behaviour — the cache is invalidated by the app's own writes — and makes the page a
// bad source of truth for "how many were there before".
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: !process.env.DATABASE_URL.includes('localhost'),
});
await db.connect();
const fourStarInDb = async () =>
  Number(
    (await db.query('select count(*)::int as n from reviews where product_slug = $1 and rating = 4', [target.slug]))
      .rows[0].n,
  );

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

// ---------- protected routes turn a stranger away ----------
await page.goto(`${BASE}/account`, { waitUntil: 'domcontentloaded' });
checkThat('GET /account redirects a stranger to /signin', page.url().includes('/signin'), page.url());
check('and remembers where they were going', new URL(page.url()).searchParams.get('next'), '/account');

// ---------- sign up ----------
await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#auth-password');
await page.fill('#auth-displayName', NAME);
await page.fill('#auth-email', EMAIL);
await page.fill('#auth-password', 'short');
await page.click(AUTH_SUBMIT);
// Each of these round trips spends a scrypt hash on top of the network, so the waits are
// generous. Waiting for the error text itself rather than a fixed pause keeps it honest.
await page.waitForFunction(
  () => document.body.innerText.includes('at least 8 characters'),
  null,
  { timeout: 20000 },
);
checkThat('a weak password is refused by the server', true);

await page.fill('#auth-password', PASSWORD);
await page.click(AUTH_SUBMIT);
// A client-side navigation, so there is no load event for waitForURL to wait on.
await page.waitForFunction(() => location.pathname.startsWith('/account'), null, { timeout: 25000 });
await page.waitForTimeout(1200);
check('signed up and landed on the account page', new URL(page.url()).pathname, '/account');
checkThat(
  'the masthead shows the display name',
  (await page.textContent('header')).includes(NAME),
  await page.textContent('header'),
);
await page.screenshot({ path: `${OUT}/auth-account.png` });

// ---------- post a review ----------
await page.goto(`${PDP}#reviews`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
checkThat('the review form is available when signed in', await page.locator('#review-body').isVisible());

// This product may already carry seeded reviews, so record the bucket before adding to it.
const fourStarBefore = await fourStarInDb();

await page.locator('input[name=rating][value="4"]').check({ force: true });
await page.fill('#review-title', HEADLINE);
await page.fill('#review-body', BODY);
await page.click('form:has(#review-body) button[type=submit]');
await page.waitForTimeout(2500);
checkThat('the form reports it saved', (await page.textContent('#reviews')).includes('Saved.'));

// A reload proves it came back from the database rather than staying in component state.
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const reviewsHtml = await page.locator('#reviews').innerHTML();
checkThat('the review survives a reload', reviewsHtml.includes(HEADLINE));
checkThat('and is attributed to the account', reviewsHtml.includes(NAME));
checkThat('the section no longer claims verified purchases', !reviewsHtml.includes('Verified purchases'));
checkThat('and no longer says review text is still to come', !reviewsHtml.includes('arrives with our own'));

// The distribution has to count real rows, not a curve fitted to the source average: what the
// 4-star bar shows must equal what the table holds.
const starBuckets = () => page.locator('#reviews li:has(span.bg-line)');
const fourStarCount = async () => {
  const row = await starBuckets().nth(1).textContent();
  return Number(row.replace(/\s+/g, ' ').replace(/^\s*4\s*/, '').trim());
};
const barCount = await starBuckets().count();
checkThat('the per-star breakdown renders five buckets', barCount === 5, String(barCount));
check('the review is counted in the database', await fourStarInDb(), fourStarBefore + 1);
check('and the 4-star bar shows exactly that', await fourStarCount(), await fourStarInDb());
await page.screenshot({ path: `${OUT}/auth-review.png` });

// ---------- editing replaces rather than duplicating ----------
await page.fill('#review-body', `${BODY} Edited.`);
await page.click('form:has(#review-body) button[type=submit]');
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
// Scoped to the list: the form below it prefills with the same headline, so counting occurrences
// across the whole section would always find two.
const listedHeadlines = await page
  .locator('#reviews li', { hasText: HEADLINE })
  .filter({ hasNotText: 'Save for later' })
  .count();
check('still one review, not two', listedHeadlines, 1);
checkThat('the edit is what is shown', (await page.textContent('#reviews')).includes('Edited.'));

// ---------- saved items ----------
// The inline heart in the summary column, not one of the cards in the Pairs-well-with rail —
// those carry aria-label="Save for later" too, and saving one would save the wrong product.
const inlineSave = page.locator('main button:has-text("Save for later")').first();
await inlineSave.click();
await page.waitForTimeout(1800);
await page.goto(`${BASE}/account/saved`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
checkThat(
  'the saved product is on /account/saved',
  (await visibleText()).includes(target.title),
);
await page.screenshot({ path: `${OUT}/auth-saved.png` });

// ---------- sign out ----------
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.click(`header button:has-text("${NAME}")`);
await page.click('header button:has-text("Sign out")');
await page.waitForTimeout(2000);
checkThat(
  'the masthead offers sign-in again',
  (await page.textContent('header')).includes('Sign in'),
  await page.textContent('header'),
);

// The review is public; the form is not.
await page.goto(`${PDP}#reviews`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const signedOutReviews = await page.locator('#reviews').innerHTML();
checkThat('the review is still public when signed out', signedOutReviews.includes(HEADLINE));
checkThat('but the form is a sign-in link', signedOutReviews.includes('Sign in to write a review'));
check('and the form itself is gone', await page.locator('#review-body').count(), 0);

// ---------- sign back in ----------
await page.goto(`${BASE}/signin`, { waitUntil: 'domcontentloaded' });
await page.fill('#auth-email', EMAIL);
await page.fill('#auth-password', 'wrong-password-1');
await page.click(AUTH_SUBMIT);
await page.waitForTimeout(800);
checkThat(
  'a wrong password is refused without naming which field was wrong',
  (await visibleText()).includes('do not match an account'),
);

await page.fill('#auth-password', PASSWORD);
await page.click(AUTH_SUBMIT);
// A client-side navigation, so there is no load event for waitForURL to wait on.
await page.waitForFunction(() => location.pathname.startsWith('/account'), null, { timeout: 20000 });
await page.waitForTimeout(600);
checkThat('signed back in', (await page.textContent('header')).includes(NAME));

// ---------- delete the review through the UI ----------
// Also cache hygiene: deleting through the app fires updateTag, so the product page stops
// counting this review. Deleting the row in SQL alone would leave the cached page counting it
// until the hourly backstop, and the next run would read a stale figure.
await page.goto(`${BASE}/account/reviews`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
checkThat('the review is listed on /account/reviews', (await visibleText()).includes(HEADLINE));
await page.click('button:has-text("Delete")');
await page.waitForTimeout(2500);
checkThat('deleting removes it from the list', !(await visibleText()).includes(HEADLINE));
check('and from the table', await fourStarInDb(), fourStarBefore);

await page.goto(`${PDP}#reviews`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
checkThat(
  'and from the product page',
  !(await page.locator('#reviews').innerHTML()).includes(HEADLINE),
);

await page.close();
await browser.close();

// ---------- clean up ----------
const { rowCount } = await db.query('delete from users where email = $1', [EMAIL]);
check('the throwaway account was removed', rowCount, 1);
// Anything an interrupted earlier run left behind, so the next one starts clean.
const stale = await db.query("delete from users where email like 'check-%@nutriva.test'");
if (stale.rowCount > 0) console.log(`(also removed ${stale.rowCount} account(s) from an interrupted run)`);
await db.end();

console.log(results.join('\n'));
console.log(results.every((r) => r.startsWith('PASS')) ? '\nall checks passed' : '\nSOME CHECKS FAILED');
process.exit(results.every((r) => r.startsWith('PASS')) ? 0 : 1);
