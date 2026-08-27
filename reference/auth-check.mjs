// End-to-end check for accounts, reviews and saved items. Needs the dev server up and
// DATABASE_URL set, and it writes to the database — point it at a scratch project, not a real one:
//
//   node reference/db/migrate.mjs
//   node reference/auth-check.mjs
//
// It signs up a throwaway account each run (the email carries a timestamp) and deletes it at the
// end, which takes its session, review and saved row with it via the cascades.
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

const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};
const checkThat = (label, condition, detail = '') => {
  results.push(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail && !condition ? `: ${detail}` : ''}`);
};

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

// ---------- protected routes turn a stranger away ----------
await page.goto(`${BASE}/account`, { waitUntil: 'networkidle' });
checkThat('GET /account redirects a stranger to /signin', page.url().includes('/signin'), page.url());
check('and remembers where they were going', new URL(page.url()).searchParams.get('next'), '/account');

// ---------- sign up ----------
await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
await page.fill('#auth-displayName', NAME);
await page.fill('#auth-email', EMAIL);
await page.fill('#auth-password', 'short');
await page.click('button[type=submit]');
await page.waitForTimeout(600);
checkThat(
  'a weak password is refused by the server',
  (await page.textContent('body')).includes('at least 8 characters'),
);

await page.fill('#auth-password', PASSWORD);
await page.click('button[type=submit]');
await page.waitForURL((url) => url.pathname.startsWith('/account'), { timeout: 15000 });
await page.waitForTimeout(600);
check('signed up and landed on the account page', new URL(page.url()).pathname, '/account');
checkThat(
  'the masthead shows the display name',
  (await page.textContent('header')).includes(NAME),
  await page.textContent('header'),
);
await page.screenshot({ path: `${OUT}/auth-account.png` });

// ---------- post a review ----------
await page.goto(`${PDP}#reviews`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
checkThat('the review form is available when signed in', await page.locator('#review-body').isVisible());

await page.locator('input[name=rating][value="4"]').check({ force: true });
await page.fill('#review-title', HEADLINE);
await page.fill('#review-body', BODY);
await page.click('form:has(#review-body) button[type=submit]');
await page.waitForTimeout(2500);
checkThat('the form reports it saved', (await page.textContent('#reviews')).includes('Saved.'));

// A reload proves it came back from the database rather than staying in component state.
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const reviewsHtml = await page.locator('#reviews').innerHTML();
checkThat('the review survives a reload', reviewsHtml.includes(HEADLINE));
checkThat('and is attributed to the account', reviewsHtml.includes(NAME));
checkThat('the section no longer claims verified purchases', !reviewsHtml.includes('Verified purchases'));
checkThat('and no longer says review text is still to come', !reviewsHtml.includes('arrives with our own'));

// The distribution has to count the row we just wrote, not a curve fitted to the source average.
const barCount = await page.locator('#reviews li:has(span.bg-line)').count();
checkThat('the per-star breakdown renders five buckets', barCount === 5, String(barCount));
const fourStarRow = await page.locator('#reviews li:has(span.bg-line)').nth(1).textContent();
checkThat('the 4-star bucket counts our review', /4\s*1/.test(fourStarRow.replace(/\s+/g, ' ')), fourStarRow);
await page.screenshot({ path: `${OUT}/auth-review.png` });

// ---------- editing replaces rather than duplicating ----------
await page.fill('#review-body', `${BODY} Edited.`);
await page.click('form:has(#review-body) button[type=submit]');
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const afterEdit = await page.locator('#reviews').innerHTML();
check('still one review, not two', (afterEdit.match(new RegExp(HEADLINE, 'g')) ?? []).length, 1);
checkThat('the edit is what is shown', afterEdit.includes('Edited.'));

// ---------- saved items ----------
await page.click('#reviews ~ *, body'); // drop focus before using the heart
await page.locator(`button[aria-label="Save for later"]`).first().click();
await page.waitForTimeout(1500);
await page.goto(`${BASE}/account/saved`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
checkThat(
  'the saved product is on /account/saved',
  (await page.textContent('body')).includes(target.title),
);
await page.screenshot({ path: `${OUT}/auth-saved.png` });

// ---------- sign out ----------
await page.goto(BASE, { waitUntil: 'networkidle' });
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
await page.goto(`${PDP}#reviews`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const signedOutReviews = await page.locator('#reviews').innerHTML();
checkThat('the review is still public when signed out', signedOutReviews.includes(HEADLINE));
checkThat('but the form is a sign-in link', signedOutReviews.includes('Sign in to write a review'));
check('and the form itself is gone', await page.locator('#review-body').count(), 0);

// ---------- sign back in ----------
await page.goto(`${BASE}/signin`, { waitUntil: 'networkidle' });
await page.fill('#auth-email', EMAIL);
await page.fill('#auth-password', 'wrong-password-1');
await page.click('button[type=submit]');
await page.waitForTimeout(800);
checkThat(
  'a wrong password is refused without naming which field was wrong',
  (await page.textContent('body')).includes('do not match an account'),
);

await page.fill('#auth-password', PASSWORD);
await page.click('button[type=submit]');
await page.waitForURL((url) => url.pathname.startsWith('/account'), { timeout: 15000 });
await page.waitForTimeout(600);
checkThat('signed back in', (await page.textContent('header')).includes(NAME));

await page.close();
await browser.close();

// ---------- clean up ----------
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});
await client.connect();
const { rowCount } = await client.query('delete from users where email = $1', [EMAIL]);
check('the throwaway account was removed', rowCount, 1);
await client.end();

console.log(results.join('\n'));
console.log(results.every((r) => r.startsWith('PASS')) ? '\nall checks passed' : '\nSOME CHECKS FAILED');
process.exit(results.every((r) => r.startsWith('PASS')) ? 0 : 1);
