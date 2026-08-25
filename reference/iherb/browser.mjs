/*
  Shared browser plumbing for the iHerb harvest.

  iHerb fronts every page with a bot check that serves an interstitial titled "Just a moment…"
  and swaps in the real document once it clears. Clearance is held in a cookie, so all three
  stages share one persistent profile — a fresh profile has to solve the check again.

  Pacing is adaptive rather than a flat sleep: the check tightens when requests come in fast,
  and loosens again after a run of clean loads. A flat 12s (what reference/harvest.mjs used)
  costs an hour of wall clock over a few hundred product pages.
*/
import { chromium } from 'playwright-core';

export const EXE =
  process.env.IHERB_CHROME ??
  'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
export const PROFILE = 'C:/Users/sixth/Desktop/Claude-OS/reference/.browser-profile';
export const ORIGIN = 'https://th.iherb.com'; // Thai storefront: THB prices, English UI

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openBrowser() {
  return chromium.launchPersistentContext(PROFILE, {
    executablePath: EXE,
    headless: true,
    viewport: { width: 1600, height: 1200 },
    locale: 'en-US',
    timezoneId: 'Asia/Bangkok',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    args: ['--disable-blink-features=AutomationControlled'],
  });
}

const CHALLENGE = /just a moment|attention required|checking your browser|access denied/i;

async function waitForRealPage(page, ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const title = await page.title().catch(() => '');
    if (title && !CHALLENGE.test(title)) return title;
    await sleep(2000);
  }
  return null;
}

/** Nudges lazy content into the DOM: iHerb defers gallery thumbs and the facts table. */
export async function scrollThrough(page, height = 12000) {
  await page.evaluate(async (max) => {
    for (let y = 0; y < max; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, 0);
  }, height);
  await page.waitForTimeout(800);
}

/**
 * Adaptive pacer. Starts optimistic, backs off hard on a challenge, and decays back down
 * after consecutive clean loads so a long run doesn't stay punished for one bad page.
 */
export function createPacer({ min = 4000, max = 30000, start = 6000 } = {}) {
  let delay = start;
  let clean = 0;
  return {
    get delay() {
      return delay;
    },
      penalise() {
      clean = 0;
      delay = Math.min(max, Math.round(delay * 1.8));
    },
    reward() {
      if (++clean >= 4) {
        clean = 0;
        delay = Math.max(min, Math.round(delay * 0.75));
      }
    },
    wait() {
      return sleep(delay + Math.round(Math.random() * 1500));
    },
  };
}

/**
 * Loads `url` in a throwaway page and hands it to `extract`. A stale page gets challenged more
 * often than a fresh one, so each visit gets its own tab. Retries twice, then gives up on
 * the URL rather than stalling the whole run.
 */
export async function visit(ctx, url, extract, { pacer, tries = 2, scroll = 12000, settle = 2200 } = {}) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      const title = await waitForRealPage(page, 45000);
      if (!title) {
        pacer?.penalise();
        continue;
      }
      await page.waitForTimeout(settle);
      if (scroll) await scrollThrough(page, scroll);
      const result = await extract(page, title);
      pacer?.reward();
      return result;
    } catch (err) {
      pacer?.penalise();
      if (attempt === tries) console.log(`    ! ${url.slice(-60)} — ${err.message.split('\n')[0]}`);
    } finally {
      await page.close().catch(() => {});
    }
  }
  return null;
}

/** Cloudinary rendition swap: the `/l/` bucket at w_900 is the largest clean product shot. */
export function largeImage(url) {
  return url
    .replace(/\/image\/upload\/[^/]*\/images\//, '/image/upload/f_auto,q_auto:good,w_900/images/')
    .replace(/\/images\/([^/]+)\/([^/]+)\/[a-z]\//, '/images/$1/$2/l/');
}

export async function downloadImage(url, dest, fs) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0', referer: `${ORIGIN}/` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2500) throw new Error(`too small (${buf.length}b)`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}
