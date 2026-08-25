# iHerb harvest

Three stages, run in order, that fill `lib/catalog.generated.json` and `public/products/iherb/`
with real product data: titles, THB prices, ratings and review counts, label copy, supplement-facts
tables and product photography from `th.iherb.com`.

```bash
node reference/iherb/discover.mjs   # listing pages -> urls.json          (~15 min, ~2,000 URLs)
node reference/iherb/harvest.mjs    # product pages -> products/*.json    (resumable, ~5 s each)
node reference/iherb/build.mjs      # products/*.json -> lib/catalog.generated.json  (instant)
```

Stage 2 is the long one and the only one that can be interrupted safely — it caches one JSON file
per product and skips anything already cached, so re-running resumes. Stage 3 is pure local
transformation: re-run it as often as you like while changing how fields are derived.

Flags:

| Flag | Stage | What it does |
|---|---|---|
| `--fresh` | discover | start the URL list over instead of merging |
| `--specials` | discover | walk only the marked-down listings |
| `--limit N` | harvest | stop after N products (the queue is round-robined by category, so a bounded run still covers every category) |
| `--specials` | harvest | fetch only products discovered on the specials pages |
| `--refresh` | harvest | re-scrape products already cached |
| `--prune` | build | delete images in `public/products/iherb/` that the built catalogue no longer references |

## Why it is shaped this way

**The bot check is the whole constraint.** iHerb serves an interstitial titled "Just a moment…"
and swaps in the real document once it clears. Clearance lives in a cookie, so every stage shares
the persistent profile at `reference/.browser-profile` (gitignored) — a fresh profile has to solve
the check again. `browser.mjs` waits for the real title rather than scraping the interstitial, and
paces requests adaptively: it starts at ~5 s, multiplies the delay by 1.8 on any challenge, and
decays back after four clean loads. A flat delay either wastes an hour or gets the run blocked.

**Discovery is separate from extraction** because they fail differently. Discovery is ~84 cheap
listing requests and is worth redoing wholesale when the query list changes. Extraction is
hundreds of expensive page loads that must never be redone. Keeping the URL list on disk between
them means a blocked extraction run costs nothing but time.

**Three tabs, one shared gate.** Product-page latency, not politeness, is what makes a serial run
take hours: each page is ~20 s of waiting and almost no work. Harvest overlaps three of them, and a
shared gate spaces the *starts* rather than letting all three fire at once. The gate widens whenever
the pacer is penalised, so one challenge slows every worker together.

**Stage 3 does all the interpretation.** Stage 2 stores the DOM's own strings — raw
supplement-facts cells, raw spec rows, raw prose blocks. Every parse, unit split and fallback
lives in `build.mjs`, so changing how a field is read never means re-scraping.

## Pricing has two shapes

A product at list price states `offers.price` in its JSON-LD. A marked-down one leaves that null and
puts two `UnitPriceSpecification` entries in `offers.priceSpecification` instead: the sale price, and
the list price tagged `StrikethroughPrice`. `parsePrice` reads both, which is why the deal rail shows
real markdowns. Reading only `offers.price` drops every discounted product for having no price —
that was the first version of this, and it is why `/specials` exists as a discovery source at all.

The buy-box fallback (`parseMarkdown`) exists for pages that render a markdown but state neither
shape. It is guarded: the DOM walk that locates the buy box sometimes lands on a "Frequently
purchased together" tile that appears earlier in the document, so lines that don't contain this
product's own price are discarded rather than used.

## Categories

`discover.mjs` decides the category from the search query that surfaced the product, which is more
reliable than guessing from a product name. Products found via a brand query have no category and
`build.mjs` assigns one from the iHerb breadcrumb trail; anything it cannot place is dropped.

## What is real and what is not

Real, straight from the source: title, brand, price, availability, 30-day volume, rating, review
count, product code, UPC, package quantity, serving size, servings per container, best-by, first
available, shipping weight, dimensions, certifications, quality marks, highlight bullets, overview
copy, suggested use, other ingredients, warnings, storage, and the supplement-facts table including
%DV.

Computed from two real numbers: cost per serving (price ÷ servings), discount percent (price
against list price).

Still ours, and clearly marked as such in the code: the per-star rating distribution
(`ratingBreakdown` — iHerb puts the breakdown behind an identity check), the storefront's own
handling standards, and the site disclaimer. iHerb's own disclaimer names iHerb and is deliberately
not copied.

## Files

| Path | What it is |
|---|---|
| `browser.mjs` | Shared Playwright launch, challenge wait, adaptive pacer, image download |
| `discover.mjs` | Stage 1 — listing pages to `urls.json` |
| `harvest.mjs` | Stage 2 — product pages to `products/<pid>.json` plus images |
| `build.mjs` | Stage 3 — cache to `lib/catalog.generated.json` |
| `urls.json` | Discovered products: pid, URL, title, category, listing figures |
| `products/<pid>.json` | One raw scrape per product — the audit trail for every field |

Images land in `public/products/iherb/` as `<slug>.jpg` for the main shot and `<slug>-2.jpg`
onward for alternate views, capped at four per product.

## Current state

470 products across all ten categories, ~1,470 images. 447 carry a supplement-facts table, 446 of
those with a real %DV; 444 carry the manufacturer's overview copy, 443 its directions, 426 its
warnings; 81 carry a real markdown; all 470 carry a real rating and review count.

Slugs come from the product title. Two listings occasionally collide once truncated — build merges
those, keeping the better-reviewed one, and logs every merge.
