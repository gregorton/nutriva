// End-to-end check for the internal dashboard and the anonymous counters behind it. Needs the dev
// server up and DATABASE_URL set, and it writes to the database:
//
//   node reference/db/migrate.mjs
//   node reference/admin-check.mjs
//
// The admin half needs one fixed address on the allowlist, because a running dev server cannot be
// handed a new environment mid-run:
//
//   ADMIN_EMAILS=admin-check@slimwellness.test
//
// Without it those assertions SKIP rather than fail. Both scratch accounts are deleted at the end,
// and every counter this script touches is put back exactly as it was found, so it is safe to
// point at the real project — unlike auth-check.mjs.
//
// Navigation waits on `domcontentloaded`, never `networkidle`: six footer links point at routes
// that do not exist and their prefetches never settle.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

try {
  process.loadEnvFile('.env.local');
} catch {
  // fall through to the ambient environment
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — this check reads and writes the database.');
  process.exit(1);
}

const ADMIN_EMAIL = 'admin-check@slimwellness.test';
const allowlisted = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .includes(ADMIN_EMAIL);

const stamp = Date.now();
const OTHER_EMAIL = `admin-check-other-${stamp}@slimwellness.test`;
const PASSWORD = 'slimwellness123';
const ZERO_QUERY = `zzq admin check ${stamp}`;
const REAL_QUERY = 'vitamin';

// Real slugs off the catalogue, so the check cannot rot when the catalogue is refreshed.
const catalog = JSON.parse(readFileSync('lib/catalog.generated.json', 'utf8'));
const inStock = catalog.items.filter((item) => item.inStock);
const API_SLUG = inStock[0].slug;
const PDP_SLUG = inStock[1].slug;

const CONTINUE = 'form:has(#auth-email) button[type=submit]';
const CREATE_SUBMIT = 'form:has(#auth-new-password) button[type=submit]';

const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};
const checkThat = (label, condition, detail = '') => {
  results.push(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail && !condition ? `: ${detail}` : ''}`);
};

// Lowercased, because innerText returns text as rendered and the `kicker` utility uppercases it —
// so a case-sensitive match on a heading is a false negative, and its negation a false pass.
const visible = async (target) => (await target.innerText('body')).toLowerCase();

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: !process.env.DATABASE_URL.includes('localhost'),
});
await db.connect();

const TZ = 'Asia/Bangkok';
const scalar = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const bangkokToday = (await scalar(`select (now() at time zone $1::text)::date::text as day`, [TZ])).day;

const productViews = async (slug) =>
  Number(
    (
      await scalar(
        `select coalesce(sum(views), 0)::int as n
           from product_views where product_slug = $1 and day = $2::date`,
        [slug, bangkokToday],
      )
    ).n,
  );

const searchRow = (text) =>
  scalar(`select searches, results from search_queries where query = $1 and day = $2::date`, [
    text,
    bangkokToday,
  ]);

const surfaceViewCount = async (surface) =>
  Number(
    (
      await scalar(
        `select coalesce(sum(views), 0)::int as n from page_views where surface = $1 and day = $2::date`,
        [surface, bangkokToday],
      )
    ).n,
  );

const post = (body) =>
  fetch(`${BASE}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// What to undo afterwards, so a run against the real project leaves no synthetic counts behind.
const before = {
  apiSlug: await productViews(API_SLUG),
  pdpSlug: await productViews(PDP_SLUG),
  home: await surfaceViewCount('home'),
  realQuery: await searchRow(REAL_QUERY),
};

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();

// ---------- the storefront still wears its chrome ----------
// The route-group move that freed /admin of the masthead must not have taken it off the shop, and a
// mistyped URL must still land somewhere that looks like the shop rather than on a bare document.
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
checkThat('the home page keeps the utility bar', (await visible(page)).includes('free delivery over'));
await page.goto(`${BASE}/no-such-page-${stamp}`, { waitUntil: 'domcontentloaded' });
const missing = await visible(page);
checkThat('a 404 keeps the chrome', missing.includes('free delivery over'));
checkThat('and offers the categories', missing.includes('discontinued'));

// ---------- the counters ----------
const fakeSlug = `no-such-product-${stamp}`;
check('POST /api/track answers 204', (await post({ kind: 'product', key: API_SLUG })).status, 204);
check(
  'a slug that is not in the catalogue is also 204',
  (await post({ kind: 'product', key: fakeSlug })).status,
  204,
);
check(
  'and writes no row',
  (await scalar('select count(*)::int as n from product_views where product_slug = $1', [fakeSlug])).n,
  0,
);
check('a real slug counts exactly once', await productViews(API_SLUG), before.apiSlug + 1);
check(
  'an invented surface writes nothing',
  (await scalar('select count(*)::int as n from page_views where surface = $1', [`fake-${stamp}`])).n,
  0,
);

// The result count is the server's, never the caller's, so a figure sent in the body is ignored.
await post({ kind: 'search', key: REAL_QUERY, results: 999 });
const real = await searchRow(REAL_QUERY);
checkThat('a matching search records a real result count', Number(real?.results) > 0, String(real?.results));
checkThat('and ignores a count sent in the body', Number(real?.results) !== 999, String(real?.results));

await post({ kind: 'search', key: `  ${ZERO_QUERY.toUpperCase()}  ` });
const zero = await searchRow(ZERO_QUERY);
checkThat('a query is normalised before it is stored', Boolean(zero), 'no row under the trimmed, lowercased query');
check('a query that matches nothing is recorded as 0', zero?.results, 0);
await post({ kind: 'search', key: '   ' });
check(
  'whitespace alone is not a search',
  (
    await scalar('select count(*)::int as n from search_queries where day = $1::date and query = $2', [
      bangkokToday,
      '',
    ])
  ).n,
  0,
);

// Every counter must land on Bangkok's day, not the database's. The two differ for the first seven
// hours of every Thai day, and GMT is what this project's Neon branch runs in.
const utcToday = (await scalar('select current_date::text as day')).day;
const landed = (
  await scalar(
    'select day::text as day from product_views where product_slug = $1 order by day desc limit 1',
    [API_SLUG],
  )
).day;
check('the counter lands on the Bangkok day', landed, bangkokToday);
results.push(
  `INFO  Bangkok today is ${bangkokToday}, Postgres current_date is ${utcToday}` +
    (bangkokToday === utcToday ? ' (the same right now)' : ' — they differ right now'),
);

// ---------- the beacon, in a real browser ----------
await page.goto(`${BASE}/p/${PDP_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
check('opening a product page counts it once', await productViews(PDP_SLUG), before.pdpSlug + 1);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
// A reload is a new JavaScript context, so the module-level dedupe set is gone with the old one and
// this counts again. That is the semantics, stated here so nobody reads the figure as a headcount:
// a view is a product opened by a browsing context, not a person and not a hit.
check('a fresh page load is a fresh count', await productViews(PDP_SLUG), before.pdpSlug + 2);

// ---------- the gate turns a stranger away ----------
const stranger = await context.newPage();
await stranger.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
checkThat('GET /admin sends a stranger to /signin', stranger.url().includes('/signin'), stranger.url());
check('and remembers where they were going', new URL(stranger.url()).searchParams.get('next'), '/admin');
await stranger.close();

// ---------- signed in, but not on the allowlist ----------
const signUp = async (target, email) => {
  await target.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
  await target.waitForSelector('#auth-email');
  await target.fill('#auth-email', email);
  await target.click(CONTINUE);
  await target.waitForSelector('#auth-new-password', { timeout: 20000 });
  await target.fill('#auth-name', `Checker ${stamp}`);

  // Create account is disabled until the password could actually be accepted, and both fields are
  // controlled inputs — a fill that lands before the form hydrates sets the DOM value where React
  // never sees it, and the button stays dead forever. So retype until the button agrees.
  for (let attempt = 0; attempt < 12; attempt++) {
    if (await target.locator(CREATE_SUBMIT).isEnabled()) break;
    await target.fill('#auth-name', `Checker ${stamp}`);
    await target.fill('#auth-new-password', '');
    await target.fill('#auth-new-password', PASSWORD);
    await target.waitForTimeout(400);
  }

  await target.click(CREATE_SUBMIT);
  await target.waitForFunction(() => location.pathname.startsWith('/account'), null, { timeout: 25000 });
  await target.waitForTimeout(800);
};

await signUp(page, OTHER_EMAIL);
const denied = await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
check('an account that is not allowlisted gets a 404, not a 403', denied.status(), 404);
checkThat('and is told nothing about the dashboard', !(await visible(page)).includes('swa-admin'));

// ---------- the allowlisted account ----------
if (!allowlisted) {
  results.push(
    `SKIP  the dashboard itself: put ADMIN_EMAILS=${ADMIN_EMAIL} in .env.local and restart the dev server`,
  );
} else {
  await context.clearCookies();
  await signUp(page, ADMIN_EMAIL);

  const admin = await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  check('an allowlisted account reaches the dashboard', admin.status(), 200);
  const consoleText = await visible(page);
  checkThat('the window bar names the console', consoleText.includes('swa-admin'));
  checkThat('and the prompt says it is read-only', consoleText.includes('dashboard --read-only'));
  checkThat('the page asks not to be indexed', (await admin.text()).includes('noindex'));

  // /admin sits outside the (storefront) route group, so none of the shop's chrome is above or below
  // it. These three strings come from the utility bar, the category nav and the footer.
  checkThat('no storefront utility bar', !consoleText.includes('free delivery over'));
  checkThat('no storefront category nav', !consoleText.includes('gut & digestion'));
  checkThat('no storefront footer', !consoleText.includes('supplements shipped from bangkok'));
  checkThat('but a way back to the shop', consoleText.includes('storefront'));

  const accounts = Number((await scalar('select count(*)::int as n from users')).n);
  check(
    'the accounts tile matches the table',
    (await page.textContent('a[href="/admin/accounts"] p[data-num]')).trim(),
    String(accounts),
  );
  const reviews = Number((await scalar('select count(*)::int as n from reviews')).n);
  check(
    'the reviews tile matches the table',
    (await page.textContent('a[href="/admin/reviews"] p[data-num]')).trim(),
    String(reviews),
  );

  await page.goto(`${BASE}/admin/accounts`, { waitUntil: 'domcontentloaded' });
  const listed = await visible(page);
  checkThat('the accounts panel lists the address it gated on', listed.includes(ADMIN_EMAIL));
  checkThat('and the account that was refused', listed.includes(OTHER_EMAIL));

  await page.goto(`${BASE}/admin/search`, { waitUntil: 'domcontentloaded' });
  checkThat('the search panel names the query that found nothing', (await visible(page)).includes(ZERO_QUERY));

  for (const path of ['/admin/reviews', '/admin/products']) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    check(`${path} renders`, response.status(), 200);
  }

  // ---------- the dashboard must not move the figures it reads ----------
  // context.request shares the browser cookie jar, so these calls arrive with the admin session on
  // them, exactly as the beacon's own fetch does (credentials default to same-origin).
  const apiWas = await productViews(API_SLUG);
  const adminPost = await context.request.post(`${BASE}/api/track`, {
    headers: { 'Content-Type': 'application/json' },
    data: { kind: 'product', key: API_SLUG },
  });
  check('an admin beacon is still answered 204', adminPost.status(), 204);
  check('but writes nothing', await productViews(API_SLUG), apiWas);

  const queryWas = Number((await searchRow(ZERO_QUERY))?.searches ?? 0);
  await context.request.post(`${BASE}/api/track`, {
    headers: { 'Content-Type': 'application/json' },
    data: { kind: 'search', key: ZERO_QUERY },
  });
  check('an admin search is not recorded either', Number((await searchRow(ZERO_QUERY))?.searches ?? 0), queryWas);

  const pdpWas = await productViews(PDP_SLUG);
  await page.goto(`${BASE}/p/${PDP_SLUG}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  check('and an admin browsing the storefront counts nothing', await productViews(PDP_SLUG), pdpWas);
}

await context.close();
await browser.close();

// ---------- put everything back ----------
const restoreViews = async (slug, was) => {
  if (was === 0) {
    await db.query('delete from product_views where product_slug = $1 and day = $2::date', [slug, bangkokToday]);
  } else {
    await db.query('update product_views set views = $3 where product_slug = $1 and day = $2::date', [
      slug,
      bangkokToday,
      was,
    ]);
  }
};
await restoreViews(API_SLUG, before.apiSlug);
await restoreViews(PDP_SLUG, before.pdpSlug);
// The chrome check opens the home page, which counts itself.
if (before.home === 0) {
  await db.query('delete from page_views where surface = $1 and day = $2::date', ['home', bangkokToday]);
} else {
  await db.query('update page_views set views = $3 where surface = $1 and day = $2::date', [
    'home',
    bangkokToday,
    before.home,
  ]);
}
await db.query('delete from search_queries where query = $1 and day = $2::date', [ZERO_QUERY, bangkokToday]);
if (before.realQuery) {
  await db.query('update search_queries set searches = $3, results = $4 where query = $1 and day = $2::date', [
    REAL_QUERY,
    bangkokToday,
    before.realQuery.searches,
    before.realQuery.results,
  ]);
} else {
  await db.query('delete from search_queries where query = $1 and day = $2::date', [REAL_QUERY, bangkokToday]);
}

const { rowCount } = await db.query("delete from users where email like 'admin-check%@slimwellness.test'");
checkThat('the scratch accounts were removed', rowCount >= 1, String(rowCount));
await db.end();

console.log(results.join('\n'));
// A SKIP is not a failure — it means that half of the feature is not configured here.
const failed = results.some((r) => r.startsWith('FAIL'));
console.log(failed ? '\nSOME CHECKS FAILED' : '\nall checks passed');
process.exit(failed ? 1 : 0);
