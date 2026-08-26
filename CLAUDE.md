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
  paths), `/starters`, `/deals`, `/search`, `/guides` + `/guides/[slug]` (SSG, one per guide),
  `not-found`.
- `components/chrome/sticky-chrome.tsx` — pins the masthead and category row to the top of the
  viewport; the utility strip above scrolls away for good. Pinned state is measured off layout
  (`getBoundingClientRect().top <= 0`) through `useSyncExternalStore`, not stored in state from an
  effect, and published as `data-stuck` so children condense off `group-data-[stuck=true]/chrome:`
  — the masthead drops 72px → 58px and the mobile search row folds away, leaving the search icon
  beside the cart. Pinned height is the `--spacing-chrome` token (103px): `html`'s
  `scroll-padding-top` and the PDP buy box's sticky offset both read it, so changing the chrome's
  height is a one-line edit.
- Everything is a server component except the cart, category-nav panel, sort select, countdown,
  rail scroller, sticky chrome and the product-gallery zoom.

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
replaced read as a progress indicator rather than a rating. **Cards carry no numeric average** — the
clipped fill already states the score to card precision, so the figure beside the stars was a second
read of the same number; only the review count follows the stars. The exact average stays on the
product page, next to the reviews jump-link and in the reviews block.

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
  publishes, up to four, switched by radio inputs and the `.gallery` rules in `globals.css`: view
  switching needs no client JS, is keyboard-operable and survives reload. Single-shot products render
  the frame alone.
- `components/pdp/zoom-shot.tsx` — one shot in that frame, plus EasyZoom-style magnification: hovering
  draws a lens over the region under the pointer and a fixed pane beside the frame showing that region
  at the source file's own resolution (900px, so roughly 2.3×), panning as the pointer moves. The pane
  is `position: fixed` to escape the frame's `overflow-hidden`, which holds only while no ancestor
  creates a containing block — do not put `transform`, `filter` or `will-change` back on the frame.
  Each shot handles its own hover and inactive shots are `visibility: hidden`, so the component needs
  no active-index state and the CSS switcher keeps working; it must stay a direct child of `.frame` in
  source order because those rules address shots by `:nth-child`. Zoom is off below 1024px and for
  touch pointers, where there is nowhere to put a pane. This replaced a `scale(1.08)` transform on the
  whole photograph — enough movement to read as a wobble, never enough to read a label — so no product
  image anywhere carries a hover transform now; the grid cards and deal rail lost theirs with it.
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

Assertions for the pinned chrome — where it pins, what it condenses to, that the category panel,
anchor targets and the sticky buy box all clear it, and that cards show stars without a numeral:

```bash
node reference/chrome-check.mjs   # needs the dev server up
```

All three scripts drive `playwright-core` (a devDependency) against the browser already installed
under `~/AppData/Local/ms-playwright`, and take `BASE_URL` when `next dev` picks a port other
than 3000. `starters-check.mjs` and `guides-check.mjs` below run the same way.

## Starter kits

`/starters` and the home band under the hero — the slot Today's deals used to hold, which was
template furniture and is gone. `lib/starters.ts` composes each kit **by rule, not by slug**: a kit
is a list of roles ("a magnesium glycinate under ฿600"), each filled with the best-selling in-stock
match, so a catalogue refresh re-resolves the kits instead of leaving them pointing at a dead
product. A role the stock cannot fill is dropped; a kit under two items is not published.

The audience is 16 and up, and the guardrails are code:

- `EXCLUDED` in `lib/starters.ts` keeps children's lines and the whole `kids` category out of every
  kit. Most gummies in stock are children's lines, which is why no kit leads on format.
- Melatonin is excluded from every kit, deliberately, while staying on the sleep shelf with its
  guide — see the note under `#what-we-wont-do` on `/starters`.
- Value is real numbers only: the sum of what the items cost, a markdown only when every item has a
  `listPrice`, and days supply from `servings` ("shortest pack: 50 days"). No bundle discount is
  implied because there isn't one, and cost per serving stays gone.
- No claim copy. `reference/starters-check.mjs` sweeps both surfaces for weight-loss, focus and
  exam-result phrasing, skipping `#what-we-wont-do` — the one block allowed to name those claims,
  because it refuses them.

`AddKit` (`components/starters/add-kit.tsx`) adds every item in one press and prints the total on
the button; the cart's `add` composes correctly in a loop because each call reads and writes the
same external snapshot.

```bash
node reference/starters-check.mjs   # needs the dev server up
```

## Guides

`/guides` and `/guides/[slug]` are the editorial side, and the one part of the site that is written
rather than harvested. `lib/guides.ts` holds all six articles as structured data — headings,
paragraphs, term/detail pairs, three takeaways, and the shelf each one sends people to — so there is
no markdown renderer and nothing to sanitise. Reading time is counted off those words at 220wpm, so
the label under a headline cannot drift from the article.

The copy rules are the catalogue's rules applied to prose: reference intakes are quoted as population
figures and named as such, label arithmetic (IU↔mcg, elemental versus compound weight, EPA+DHA per
softgel) is checkable against the bottle in your hand, and no sentence needs a study the site cannot
show you. Every article closes on the same disclaimer and the COA guide states plainly that Nutriva
runs no laboratory. Note that the footer and utility strip still carry older "we publish the
certificate of analysis for every lot" copy, which contradicts that — worth reconciling.

Photography is harvested, not ours. `reference/editorial/photos.mjs` pulls one CC0 / public-domain /
CC BY photo per guide from Openverse, downscales it to 2000px through Next's own `sharp`, and writes
the credit to `lib/editorial.generated.json`; `creditLine()` renders it and `guides-check.mjs`
asserts a credit exists for every cover, because a missing one puts a CC BY image out of licence.
Modern stock sources are tried before Flickr and Wikimedia, and museum archives never — an
unfiltered search returns watermarked derivatives and stereoscope cards. Covers are reviewed by eye
and then pinned by image id in `PICKS`; `--candidates <slug>` writes a shortlist to look through.

```bash
node reference/editorial/photos.mjs                     # fill in anything missing
node reference/editorial/photos.mjs --candidates <slug> # shortlist for review
node reference/guides-check.mjs                         # needs the dev server up
```

Card sizes live in `components/guides/guide-card.tsx`: `GuideFeature` (16:9 lead), `GuideCard` (3:2
grid) and `GuideRow` (thumbnail beside the headline). The home strip
(`components/home/editorial-strip.tsx`) is one feature beside the whole remaining set — it used to be
four typographic cards, which read as small print next to a page of product photography.

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

This folder is its own repository, on `main`, pushed to `github.com/gregorton/nutriva`.
