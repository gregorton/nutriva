// Screenshots the local dev server so design work can be reviewed at real size.
// Usage: node reference/shoot.mjs [label]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'reference/preview';
const label = process.argv[2] ? `-${process.argv[2]}` : '';
const BASE = 'http://localhost:3000';

const SHOTS = [
  { name: 'home', path: '/', width: 1440, height: 950, slices: 4, step: 900 },
  { name: 'plp', path: '/c/sleep', width: 1440, height: 950, slices: 2, step: 900 },
  { name: 'pdp', path: '/p/now-foods-vitamin-d3-k2-120-capsules', width: 1440, height: 950, slices: 2, step: 900 },
  { name: 'home-mobile', path: '/', width: 390, height: 844, slices: 3, step: 800 },
  { name: 'plp-mobile', path: '/c/sleep', width: 390, height: 844, slices: 2, step: 800 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, headless: true });

for (const shot of SHOTS) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 1,
  });
  try {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);
    for (let i = 0; i < shot.slices; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * shot.step);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${shot.name}${label}-${i + 1}.png` });
    }
    console.log(`${shot.name}: ${shot.slices} slices`);
  } catch (e) {
    console.log(`${shot.name} failed: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log('done');
