// Assertions for the home hero's two tabs and their slideshows. Run with the dev server up:
//   node reference/hero-check.mjs
//   BASE_URL=http://localhost:3100 node reference/hero-check.mjs   (against `next start`)
//
// What it holds to: the arrows move within the tab you are on and never across to the other one,
// the slideshow wraps in both directions so no arrow is ever disabled, the dots follow that position
// and jump to their slide, and only the slide on screen is reachable — every other one is inert.
// Medical equipment is locked for now, so its assertions are that it cannot be opened: the tab is
// announced disabled, carries the restricted cursor, and a press leaves the topic where it was.
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/sixth/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const check = (label, actual, expected) => {
  const pass = String(actual) === String(expected);
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(600);

const next = page.locator('button[aria-label="Next slide"]');
const prev = page.locator('button[aria-label="Previous slide"]');
const supplementsTab = page.locator('button[aria-controls="hero-panel-supplements"]');
const equipmentTab = page.locator('button[aria-controls="hero-panel-equipment"]');
const dots = page.locator('button[aria-label^="Slide "]');

// The active slide's heading is the one carrying #hero-heading, which is also what the section is
// labelled by — so this doubles as a check that the label never points at a hidden heading.
const heading = () => page.evaluate(() => document.querySelector('#hero-heading')?.textContent.trim());
const headings = () => page.evaluate(() => document.querySelectorAll('#hero-heading').length);
const pressed = (name) =>
  page.evaluate((n) => document.querySelector(`button[aria-controls="hero-panel-${n}"]`).getAttribute('aria-pressed'), name);
const panelOff = (name) => page.evaluate((n) => document.getElementById(`hero-panel-${n}`).hasAttribute('inert'), name);
const live = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('#hero-panel-supplements [aria-roledescription="slide"]')].filter(
      (el) => !el.hasAttribute('inert'),
    ).length,
  );
const current = () =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll('button[aria-label^="Slide "]')];
    return all.findIndex((el) => el.getAttribute('aria-current') === 'true');
  });
const step = async (locator) => {
  await locator.click();
  await page.waitForTimeout(700);
};
// A press on the locked tab. Playwright reads `aria-disabled` as not-enabled and would wait for it
// to become clickable, which is the point of the attribute — so this presses it anyway, the way a
// pointer does, and the assertions below are that nothing moved.
const press = async (locator) => {
  await locator.click({ force: true });
  await page.waitForTimeout(700);
};

// ---------- Supplements: the arrow stays inside the tab ----------
check('opens on the Supplements tab', await pressed('supplements'), 'true');
check('opens on the opening slide', await heading(), 'Vitamins, minerals and daily essentials');
check('exactly one heading carries the id', await headings(), 1);
check('the equipment panel starts inert', await panelOff('equipment'), 'true');

// The slide count follows the photographs in `SHELVES`, so nothing here hardcodes it: the dot row is
// checked against the slides actually mounted in the panel, and the last shelf's name is read off the
// last dot's own label (`Slide N of N: <heading>`).
const slideCount = await dots.count();
const mounted = await page.evaluate(
  () => document.querySelectorAll('#hero-panel-supplements [aria-roledescription="slide"]').length,
);
check('one dot per supplements slide', slideCount, mounted);
check('the dot row starts on the first slide', await current(), 0);

const lastShelf = await dots.nth(slideCount - 1).evaluate((el) => el.getAttribute('aria-label').split(': ').slice(1).join(': '));

await step(next);
check('next advances the shelf', await heading(), 'Vitamins');
check('next did not switch tab', await pressed('supplements'), 'true');
check('next left the equipment panel inert', await panelOff('equipment'), 'true');
check('the dot follows the slide', await current(), 1);
check('only the slide on screen is reachable', await live(), 1);
check('focus stays on the arrow after a press', await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Next slide');
check('neither arrow is ever disabled', await page.evaluate(() => !!document.querySelector('button[aria-label$=" slide"][disabled]')), 'false');

for (let i = 2; i < slideCount; i++) await step(next);
check('pressing next through the row reaches the last shelf', await heading(), lastShelf);

await step(next);
check('the slideshow wraps forward', await heading(), 'Vitamins, minerals and daily essentials');
await step(prev);
check('the slideshow wraps back', await heading(), lastShelf);

// ---------- Medical equipment: locked ----------
// The tab is visible but closed off: announced disabled rather than `disabled`, so it keeps the
// restricted cursor and a hover title instead of going silent under the pointer.
check('the equipment tab is announced disabled', await equipmentTab.getAttribute('aria-disabled'), 'true');
check('it is not a real `disabled` button', await equipmentTab.evaluate((el) => el.disabled), 'false');
check('it shows the restricted cursor', await equipmentTab.evaluate((el) => getComputedStyle(el).cursor), 'not-allowed');
check('it is neither pressed nor unpressed', await pressed('equipment'), 'null');

await press(equipmentTab);
check('pressing it does not switch topic', await pressed('supplements'), 'true');
check('the equipment panel stays inert', await panelOff('equipment'), 'true');
check('supplements holds the slide it was on', await heading(), lastShelf);
check('the dot row stays with it', await current(), slideCount - 1);
check('the supplements tab is still live', await supplementsTab.getAttribute('aria-disabled'), 'null');

// ---------- a dot jumps to its slide ----------
await step(dots.nth(1));
check('a dot press jumps to its slide', await heading(), 'Vitamins');
check('a dot press does not switch tab', await pressed('supplements'), 'true');

// ---------- the frame itself ----------
check(
  'the off-screen panel is parked outside the frame',
  await page.evaluate(() => {
    const frame = document.querySelector('[aria-roledescription="carousel"]').getBoundingClientRect();
    const off = document.getElementById('hero-panel-equipment').getBoundingClientRect();
    return off.left >= frame.right - 1;
  }),
  'true',
);
check(
  'no horizontal overflow',
  await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  'true',
);

await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
