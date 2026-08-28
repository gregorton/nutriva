/**
 * Fetches the USD/THB market rate and writes `lib/fx.generated.json`, the file `lib/fx.ts` reads
 * to restate every catalogue price at today's rate.
 *
 * The catalogue holds the THB figure th.iherb.com printed on the day it was harvested, so without
 * this the entire storefront is priced at one frozen exchange rate and drifts further off every
 * week. See `lib/fx.ts` for why the rate is applied as a ratio against the *market* rate on the
 * harvest date rather than against the rate iHerb itself charged.
 *
 * Two sources, tried in order, because a shop's prices should not depend on one free API being up:
 * the ECB's daily reference rate, then open.er-api.com. Both are keyless.
 *
 * The rate is written only once it has moved past THRESHOLD, so prices sit still for weeks at a
 * time rather than twitching by a satang every morning. A rate outside BAND is refused outright —
 * a malformed response should not be able to reprice 470 products.
 *
 * Run: node reference/fx.mjs [--force]
 *   --force  write even when the move is under the threshold (the first run, or after the harvest
 *            rate in lib/fx.ts changes)
 *
 * The output is committed on purpose: a build then needs no network, and the file's git history is
 * a record of which rate produced which deploy.
 */
import { readFile, writeFile } from "node:fs/promises";

const OUT = "lib/fx.generated.json";

/** Plausible USD/THB. The rate has not left this range this century, so a response outside it is
 *  a broken API rather than news. */
const BAND = [25, 45];

/** How far the rate must move before prices are rewritten. 0.5% is about ฿3 on a ฿600 pack. */
const THRESHOLD = 0.005;

const SOURCES = [
  {
    name: "ECB reference rate",
    url: "https://api.frankfurter.app/latest?from=USD&to=THB",
    read: (body) => ({ rate: body?.rates?.THB, date: body?.date }),
  },
  {
    name: "open.er-api.com",
    url: "https://open.er-api.com/v6/latest/USD",
    read: (body) => ({
      rate: body?.rates?.THB,
      date: body?.time_last_update_unix
        ? new Date(body.time_last_update_unix * 1000).toISOString().slice(0, 10)
        : null,
    }),
  },
];

const today = () => new Date().toISOString().slice(0, 10);

/** First source that answers with a plausible number wins. A source that is down, has changed
 *  shape or is quoting nonsense is skipped, and only an empty list of sources is fatal. */
async function fetchRate() {
  const failures = [];

  for (const source of SOURCES) {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { rate, date } = source.read(await response.json());
      if (typeof rate !== "number" || !Number.isFinite(rate)) throw new Error("no THB rate in the response");
      if (rate < BAND[0] || rate > BAND[1]) throw new Error(`${rate} is outside ${BAND[0]}–${BAND[1]}`);

      // Four decimals is finer than any price on the site can express, and keeps the diff small.
      return { rate: Math.round(rate * 10_000) / 10_000, date: date ?? today(), source: source.name };
    } catch (error) {
      failures.push(`  ${source.name}: ${error.message}`);
    }
  }

  throw new Error(`no source returned a usable rate\n${failures.join("\n")}`);
}

const previous = await readFile(OUT, "utf8")
  .then(JSON.parse)
  .catch(() => null);
const next = await fetchRate();
const move = previous ? next.rate / previous.rate - 1 : null;
const pct = (value) => `${value > 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;

if (previous && Math.abs(move) < THRESHOLD && !process.argv.includes("--force")) {
  console.log(
    `held at ${previous.rate} — ${next.source} says ${next.rate}, a ${pct(move)} move, under the ` +
      `${(THRESHOLD * 100).toFixed(1)}% threshold`,
  );
  process.exit(0);
}

await writeFile(OUT, `${JSON.stringify({ ...next, fetchedAt: new Date().toISOString() }, null, 2)}\n`);
console.log(
  previous
    ? `${previous.rate} -> ${next.rate} (${pct(move)}) from ${next.source}, dated ${next.date}`
    : `${next.rate} from ${next.source}, dated ${next.date}`,
);
