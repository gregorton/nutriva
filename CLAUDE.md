@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Nutriva** — a supplement storefront for the Thai market: English UI copy, ฿ THB pricing, delivery
from Bangkok. The catalogue is real product data harvested from `th.iherb.com` (see Catalogue data);
branding, page structure, design system and components are ours.

Structure and navigation take after `th.iherb.com` — dense catalogue grids, utility strip, category
nav, deal rail, trust band. The visual identity deliberately does not: see Design system.

## Commands

```bash
npm run dev     # Turbopack dev server on :3000
npm run build   # production build — one prerendered route per product plus the static pages
npm run lint    # eslint (flat config)
npx tsc --noEmit
npx next typegen   # regenerate PageProps/LayoutProps route types after adding a route
```

Refresh the catalogue (see Catalogue data; stage 2 is long and resumable):

```bash
node reference/iherb/discover.mjs && node reference/iherb/harvest.mjs && node reference/iherb/build.mjs
```

Screenshot the running dev server at desktop and mobile (writes `reference/preview/`, gitignored):

```bash
node reference/shoot.mjs label
```

## Architecture

Next.js 16.3 App Router, React 19, Tailwind v4, TypeScript. No backend — everything renders from a
static catalogue module.

- `lib/catalog.ts` — the single data boundary. Reads `catalog.generated.json` and exposes every query
  the UI needs (`byCategory`, `bestSellers`, `deals`, `related`, `search`, `brandsIn`…). Label fields
  arrive structured, so this file no longer parses anything out of titles; the only computed values
  are discount percent and `perServing`, which the pipeline still emits but no surface reads.
- `lib/query.ts` — filter and sort state lives in the URL. `toggleHref`/`setHref` build the next URL, so
  filters are links, not form controls: shareable, back-navigable, and functional without JS.
- `lib/subcategories.ts` — the type split behind the browse rail at the head of `/c/[slug]`
  (`components/plp/category-type-rail.tsx`): label + match terms per category, but a tile only shows
  when the stock matches it, so the rail describes the catalogue rather than a taxonomy. Categories
  whose terms find too few groups top up with dosage forms read off the same products. A tile is the
  `refine` URL parameter as a link, and `inSubcategory` filters the grid on the terms the tile counted.
- `components/cart/cart-context.tsx` — cart in `localStorage`, read via `useSyncExternalStore` with an
  empty server snapshot. Do not move this to `useState` + effect; that reintroduces a hydration
  mismatch and trips `react-hooks/set-state-in-effect`.
- Routes: `/` home, `/c/[slug]` category (dynamic — reads searchParams), `/p/[slug]` product (SSG, 178
  paths), `/deals`, `/search`, `not-found`.
- Everything is a server component except the cart, category-nav panel, sort select, countdown and
  rail scroller.

## Design system

Tokens live in `app/globals.css` under `@theme`. The palette inverts the category convention on
purpose — the reference site uses green chrome with an orange button, so a green-chrome Nutriva would
read as a clone.

| Role | Token | Value |
|---|---|---|
| Brand chrome (utility bar, nav, footer accents) | `plum-800` / `plum-900` | `#3b1430` / `#2b0f20` |
| Secondary accent — active nav, countdown digits, deal meters | `turmeric-500` | `#d08a0e` |
| Add-to-cart, and nothing else — a gradient, via `btn-cart` | `cart-top` → `cart-bottom` | `#c06d00` → `#bc5500` |
| Review stars, and nothing else | `star` | `#f5a623` |
| Volume figures ("90K bought this month") | `sold` | `#659fd9` |
| Trust semantics only (in stock, verified, savings) | `pandan-600` | `#1e5b41` |
| Markdown price | `sale-600` | `#a3123a` |
| Neutrals | `ink` `muted` `line` `paper` `paper-warm` | warm greys, `#fbf9f5` bands |

Three faces, three jobs → now two: **Fraunces** display for headings only, and **Google Sans** for
everything else including all data (dose, pack size, countdown digits, kickers). The mono that used to
carry data type was replaced because it read as "computery"; `font-variant-numeric: tabular-nums` keeps
figures aligned in grid columns without it. Google Sans also ships a Thai subset, which the eventual
localisation needs.

Custom utilities: `shell` (page container), `facts` (12px tabular data type), `kicker` (uppercase
eyebrow), `btn-cart` (the gradient add-to-cart, every placement), `.rail` (snap scroller),
`.reveal-add` (hover-reveal add-to-cart, see below).

**The signature device** is the facts strip — a back-of-bottle spec row on every product card
(`components/product/facts-strip.tsx`), opened out on the product page into the Key info grid
(`components/pdp/at-a-glance.tsx`) and the supplement-facts table
(`components/pdp/supplement-facts.tsx`). It carries pack size: the figure shoppers compare a listing on
and that a product photo cannot show. Keep the card version one fixed-height line, so card CTAs align
across a grid row. Cost per serving used to sit on its right; it was computed rather than stated by any
label, and is gone from the storefront entirely — do not reintroduce it.

**Ratings are stars everywhere** (`components/ui/stars.tsx`), `md` on the product page and `sm` in the
card grid, filled by a clipped overlay so a 4.8 shows a part-filled fifth star. The card meter bar this
replaced read as a progress indicator rather than a rating.

**Product cards are one link.** A single absolutely-positioned anchor (`before:absolute before:inset-0`
on the title link) covers the card, the way the reference site does it — one tab stop per product,
text stays selectable, and no button nested inside an anchor. Add to cart is layered above that overlay
at `z-20` and only appears on hover or focus (`.reveal-add` in `app/globals.css`). Devices without
hover show it permanently; `reference/interact.mjs` asserts all of that, so run it after touching cards:

```bash
node reference/interact.mjs   # needs the dev server up
```

## Product page anatomy

`/p/[slug]` follows the reference site's PDP composition, in three columns: media, a summary column
(flag → title → brand → rating → stock and momentum → pack size → at a glance → one cross-sell →
rankings), and a sticky buy box. Below that fold the **Pairs well with** rail comes first and the
descriptive section second: an unconvinced shopper should meet the alternatives before a wall of label
copy.

- `components/pdp/product-gallery.tsx` — the media column. One view per shot the manufacturer
  publishes, up to four, switched by radio inputs and the `.gallery` rules in `globals.css`: no client
  JS, keyboard-operable, survives reload. Single-shot products render the frame alone.
- `components/pdp/product-information.tsx` — the **Product information** section: tinted title bar over
  a 14/10 column split, with Overview, Specifications, Suggested use, Other ingredients, Warnings,
  Storage and Disclaimer on the left and `supplement-facts.tsx` on the right. Nothing descriptive
  belongs beside the buy box any more; add new copy blocks here.
- `lib/product-info.ts` — chooses and formats that copy. The label text arrives with the product, so
  this layer's job is selection and fallback, not invention: where a product's page states no overview,
  no directions or no warnings, a derived-but-true line stands in, and panels with no input at all
  render nothing. `ratingBreakdown` is the one remaining shaped value — see Catalogue data.
- `components/pdp/buy-box.tsx` — the reference's purchase-option tile: price, markdown, free-delivery
  threshold, stepper with a per-order cap, then a full-width `btn-cart` CTA. Its subscription add-on,
  BNPL tiles and "see price in cart" states are deliberately absent — nothing behind this storefront
  supports them.
- Reference green becomes `plum-700` on this page (in-stock, savings, rating bars, cert marks); stars
  are `star` yellow and the add-to-cart is the `btn-cart` gradient. The shared product card still
  carries the site's `pandan` trust green, so cards in the rail are the one green left on the page.
- No fabricated testing claims anywhere on this page. The lot strip under the gallery ("Lot NOWF-180 ·
  test results published"), the per-lot copy in the buy box and the invented "two-lab lot release"
  standard are all gone: nothing behind the storefront runs a lab. Marks read off the label stay.
- `components/ui/hint.tsx` is the info-mark popover, CSS only: hover and keyboard focus, no client JS.

Assertions for the layout, the stepper, the cart round-trip and the colour rules:

```bash
node reference/pdp-check.mjs   # needs the dev server up
```

## Catalogue data

`reference/iherb/` holds a three-stage pipeline — `discover` (listing pages → `urls.json`), `harvest`
(product pages → `products/<pid>.json` plus `public/products/iherb/*.jpg`), `build`
(→ `lib/catalog.generated.json`). Read `reference/iherb/README.md` before touching it; the bot check
dictates the whole design.

The short version of what you can trust:

- **Real, from the source page**: title, brand, THB price, availability, 30-day volume, rating and
  review count, product code, UPC, package quantity, serving size, servings per container, best-by,
  first available, shipping weight, dimensions, certification and quality marks, highlight bullets,
  overview copy, suggested use, other ingredients, warnings, storage, and the supplement-facts table
  including %DV.
- **Computed from two real numbers**: discount percent. (`perServing` is still computed and still in the
  JSON, but cost per serving is no longer shown anywhere — it was ours, not the label's.)
- **Still ours**: the per-star rating distribution (`ratingBreakdown` — the source puts the breakdown
  behind an identity check), the storefront's own handling standards, and the site disclaimer. The
  source's own disclaimer names the source and is deliberately not copied.

A field the source does not state comes through as `null` or an empty array and its panel renders
nothing. Keep that rule when adding fields: it is what stops the page claiming a %DV or a best-by date
that no label backs.

Stage 3 does all the interpretation, so changing how a field is read is a `build.mjs` edit plus a
rerun — never a re-scrape. Stage 2 caches per product and skips what it already has, so an interrupted
run resumes.

## Reference material

`reference/NOTES.md` — measured iHerb tokens, per-page anatomy, and what was deliberately not copied
(three stacked interruptions, six-element product cards, promo-led hero). `reference/shots/` holds the
source screenshots. `reference/capture.mjs` re-captures them.

## Git

This folder is **not** its own repository. It sits inside the repo rooted at `C:/Users/sixth` (branch
`master`, unrelated history), and nothing here is tracked. Run `git init` here before the first commit.
