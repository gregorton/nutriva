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
const EMAIL = `check-${stamp}@slimwellness.test`;
const NAME = `Checker ${stamp}`;
const PASSWORD = 'slimwellness123';
const HEADLINE = `Automated check ${stamp}`;
const BODY = 'Written by reference/auth-check.mjs to prove the review round trip works end to end.';

// The masthead search button is also type=submit and precedes these forms in the DOM, so every
// submit is scoped to the form it belongs to. The flow is two steps, and each step is its own
// form: an address, then either a password or a name and a new one.
const CONTINUE = 'form:has(#auth-email) button[type=submit]';
const CREATE_SUBMIT = 'form:has(#auth-new-password) button[type=submit]';
const SIGNIN_SUBMIT = 'form:has(#auth-password) button[type=submit]';

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
// Step one is a GET form, so Continue is a navigation and the address arrives in the URL.
await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#auth-email');
await page.fill('#auth-email', EMAIL);
await page.click(CONTINUE);
await page.waitForSelector('#auth-new-password', { timeout: 20000 });
check('Continue carries the address into the URL', new URL(page.url()).searchParams.get('email'), EMAIL);
checkThat(
  'an address with no account lands on the create screen',
  (await visibleText()).includes('find an account with that email address'),
);
check('and does not ask for an existing password', await page.locator('#auth-password').count(), 0);

await page.fill('#auth-name', NAME);
// The button is dead until the password could actually be accepted, so a weak one cannot be
// submitted at all. It is the same predicate the server applies in lib/validate.ts — the meter
// never blocks a password checkRegistration would take, and never offers one it would refuse.
await page.fill('#auth-new-password', 'short');
await page.waitForTimeout(300);
checkThat('a weak password cannot be submitted', await page.locator(CREATE_SUBMIT).isDisabled());
checkThat(
  'and the meter says what is missing',
  (await visibleText()).includes('at least 8 characters'),
);

await page.fill('#auth-new-password', PASSWORD);
await page.waitForTimeout(300);
checkThat('a usable password enables the button', await page.locator(CREATE_SUBMIT).isEnabled());
await page.click(CREATE_SUBMIT);
// A client-side navigation, so there is no load event for waitForURL to wait on. Each of these
// round trips spends a scrypt hash on top of the network, so the waits are generous.
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
await page.waitForSelector('#auth-email');
await page.fill('#auth-email', EMAIL);
await page.click(CONTINUE);
await page.waitForSelector('#auth-password', { timeout: 20000 });
checkThat(
  'an address with an account goes straight to its password',
  (await page.locator('#auth-new-password').count()) === 0,
);
await page.fill('#auth-password', 'wrong-password-1');
await page.click(SIGNIN_SUBMIT);
await page.waitForTimeout(1200);
checkThat(
  'a wrong password is refused without naming which field was wrong',
  (await visibleText()).includes('do not match an account'),
);

await page.fill('#auth-password', PASSWORD);
await page.click(SIGNIN_SUBMIT);
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

// ---------- signing in with a provider ----------
// Driven with fetch rather than the browser: every step is a redirect, and the parts worth
// asserting are the query string going out and the refusals coming back. Reaching a real consent
// screen would need somebody to click it, so what is checked here is that nothing gets past the
// gate without the cookie this server set.
const hop = (path, headers = {}) =>
  fetch(`${BASE}${path}`, { redirect: 'manual', headers }).then((r) => ({
    status: r.status,
    location: (r.headers.get('location') ?? '').replace(BASE, ''),
    cookies: r.headers.getSetCookie(),
  }));

const unknown = await hop('/api/auth/twitter');
check('an unconfigured provider is turned away', unknown.location, '/signin?error=provider');

// The rest only means anything once credentials are set, which is also when the buttons appear.
// Fetched without cookies: the browser is signed in by this point, and /signin redirects away
// from itself for anyone who is.
const signinHtml = await fetch(`${BASE}/signin`).then((r) => r.text());
const buttons = (signinHtml.match(/href="\/api\/auth\//g) ?? []).length;

if (buttons === 0) {
  results.push('SKIP  provider sign-in: no credentials set, so no buttons to test');
} else {
  // These two have to sit inside the configured branch: an unconfigured provider refuses
  // everything at the door with error=provider, before it looks at a cookie or a cancellation,
  // which is the right order but a different answer.
  const noCookie = await hop('/api/auth/google/callback?code=abc&state=xyz');
  check('a callback with no cookie is refused', noCookie.location, '/signin?error=expired');

  const cancelled = await hop('/api/auth/google/callback?error=access_denied');
  check('a cancelled sign-in says so', cancelled.location, '/signin?error=cancelled');

  const start = await hop('/api/auth/google?next=%2Faccount%2Fsaved');
  const authorize = new URL(start.location.startsWith('http') ? start.location : `${BASE}${start.location}`);
  const jar = start.cookies.find((v) => v.startsWith('swa.oauth='))?.split(';')[0] ?? '';
  const stash = JSON.parse(decodeURIComponent(jar.slice('swa.oauth='.length)));

  check('the flow starts at the provider', authorize.host, 'accounts.google.com');
  check('asking for a code', authorize.searchParams.get('response_type'), 'code');
  check('with the redirect URI this origin serves', authorize.searchParams.get('redirect_uri'), `${BASE}/api/auth/google/callback`);
  checkThat('carrying a state value', (authorize.searchParams.get('state') ?? '').length >= 40);
  check('and a PKCE challenge', authorize.searchParams.get('code_challenge_method'), 'S256');
  checkThat(
    'the verifier stays in an httpOnly cookie',
    start.cookies.some((v) => v.startsWith('swa.oauth=') && /HttpOnly/i.test(v)),
  );
  checkThat(
    'and never goes to the provider',
    !authorize.searchParams.has('code_verifier') && stash.verifier.length >= 40,
  );

  // ?next= decides where somebody lands while signed in, so it cannot be an absolute URL.
  const offsite = await hop('/api/auth/google?next=https%3A%2F%2Fevil.example%2Fx');
  const offsiteJar = offsite.cookies.find((v) => v.startsWith('swa.oauth='))?.split(';')[0] ?? '';
  check(
    'an off-site next is discarded',
    JSON.parse(decodeURIComponent(offsiteJar.slice('swa.oauth='.length))).next,
    '/account',
  );
  check('a local one is kept', stash.next, '/account/saved');

  const tampered = await hop(`/api/auth/google/callback?code=abc&state=tampered`, { cookie: jar });
  check('a mismatched state is refused', tampered.location, '/signin?error=state');

  const noCode = await hop(`/api/auth/google/callback?state=${encodeURIComponent(stash.state)}`, { cookie: jar });
  check('a callback with no code is refused', noCode.location, '/signin?error=code');

  const crossed = await hop(
    `/api/auth/facebook/callback?code=abc&state=${encodeURIComponent(stash.state)}`,
    { cookie: jar },
  );
  // Only meaningful with a second provider configured. With one, Facebook's callback refuses at
  // the door for not being set up, which is right but is a different answer.
  if (signinHtml.includes('href="/api/auth/facebook')) {
    check("one provider's cookie cannot be used on another", crossed.location, '/signin?error=state');
  } else {
    results.push('SKIP  cross-provider cookie reuse: only one provider configured');
  }
}

await page.close();
await browser.close();

// ---------- clean up ----------
const { rowCount } = await db.query('delete from users where email = $1', [EMAIL]);
check('the throwaway account was removed', rowCount, 1);
// Anything an interrupted earlier run left behind, so the next one starts clean.
const stale = await db.query("delete from users where email like 'check-%@slimwellness.test'");
if (stale.rowCount > 0) console.log(`(also removed ${stale.rowCount} account(s) from an interrupted run)`);
await db.end();

console.log(results.join('\n'));
// A SKIP is not a failure — it means that part of the feature is not configured yet.
const failed = results.some((r) => r.startsWith('FAIL'));
console.log(failed ? '\nSOME CHECKS FAILED' : '\nall checks passed');
process.exit(failed ? 1 : 0);
