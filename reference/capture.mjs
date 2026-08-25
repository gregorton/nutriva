// Reference capture: screenshots of th.iherb.com for design inspiration.
// Usage: node reference/capture.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'reference/shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, headless: true });

async function newPage(width, height) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    locale: 'th-TH',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  });
  return ctx.newPage();
}

async function dismiss(page) {
  // "No thanks" decline link on the email-signup modal, then generic close buttons
  for (const sel of [
    'text=ไม่เป็นไร ขอบคุณ!',
    'text=No thanks',
    '[aria-label*="lose" i]',
    '[class*="close" i]',
    '#cookie-accept',
  ]) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.click({ timeout: 1500, force: true });
        await page.waitForTimeout(500);
      }
    } catch {}
  }
  await page.keyboard.press('Escape').catch(() => {});
  // last resort: strip any full-screen overlay and restore scrolling
  await page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' || +cs.zIndex < 100) continue;
      const r = el.getBoundingClientRect();
      const coversCenter =
        r.width > vw * 0.35 && r.height > vh * 0.35 &&
        r.left < vw / 2 && r.right > vw / 2 && r.top < vh / 2 && r.bottom > vh / 2;
      if (coversCenter) el.remove();
    }
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });
}

async function settle(page) {
  await dismiss(page);
  const h = await page.evaluate(async () => {
    for (let y = 0; y < 30000; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
      if (y > document.body.scrollHeight) break;
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 800));
    return document.body.scrollHeight;
  });
  return h;
}

async function slices(page, name, count, step) {
  for (let i = 0; i < count; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * step);
    await page.waitForTimeout(600);
    await dismiss(page);
    await page.screenshot({ path: `${OUT}/${name}-${String(i + 1).padStart(2, '0')}.png` });
  }
}

// ---------- desktop home ----------
const page = await newPage(1440, 900);
await page.goto('https://th.iherb.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(3000);
const height = await settle(page);
console.log('home height:', height);
await slices(page, 'home-desktop', 7, 860);

// harvest useful links for PLP / PDP captures
const links = await page.evaluate(() => {
  const hrefs = [...document.querySelectorAll('a')].map((a) => a.href);
  const uniq = (arr) => [...new Set(arr)];
  return {
    products: uniq(hrefs.filter((h) => /\/pr\//.test(h))).slice(0, 5),
    cats: uniq(hrefs.filter((h) => /\/c\/|\/categories\//.test(h))).slice(0, 8),
  };
});
console.log(JSON.stringify(links, null, 2));

// ---------- mobile home ----------
const m = await newPage(390, 844);
await m.goto('https://th.iherb.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await m.waitForTimeout(3000);
await settle(m);
await slices(m, 'home-mobile', 3, 800);

// ---------- category listing ----------
if (links.cats[0]) {
  const plp = await newPage(1440, 900);
  await plp.goto(links.cats[0], { waitUntil: 'domcontentloaded', timeout: 90000 });
  await plp.waitForTimeout(3000);
  await settle(plp);
  await slices(plp, 'plp-desktop', 3, 860);
  console.log('plp:', links.cats[0]);
}

// ---------- product detail ----------
if (links.products[0]) {
  const pdp = await newPage(1440, 900);
  await pdp.goto(links.products[0], { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pdp.waitForTimeout(3000);
  await settle(pdp);
  await slices(pdp, 'pdp-desktop', 3, 860);
  console.log('pdp:', links.products[0]);
}

await browser.close();
console.log('done');
