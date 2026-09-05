@AGENTS.md

# CLAUDE.md

**Slim Wellness Asia** — supplement storefront for Thailand: English UI copy, ฿ THB pricing, Bangkok delivery. The
catalogue is real product data harvested from `th.iherb.com`; structure, design system and components are ours; name and
logo are the client's. Navigation follows `th.iherb.com`, the visual identity deliberately does not. Next.js 16.3 App
Router, React 19, Tailwind v4, TypeScript. Two data sources, no other backend: the static catalogue module, and
PostgreSQL (Neon) for what visitors write.
## Commands

```bash
npm run dev        # Turbopack dev server on :3000
npm run build      # one prerendered route per product plus the static pages
npm run lint && npx tsc --noEmit
npx next typegen   # regenerate PageProps/LayoutProps types after adding a route

node reference/iherb/{discover,harvest,build}.mjs   # catalogue, in that order; stage 2 resumes
node reference/fx.mjs --force                       # force a reprice; a workflow normally does this
node reference/db/migrate.mjs && node reference/db/seed.mjs   # needs DATABASE_URL in .env.local
node reference/brand/icons.mjs                      # lockup + icons from the square logo
node reference/editorial/photos.mjs [--candidates <slug>]     # guide covers
node reference/shoot.mjs label                      # screenshot dev server -> reference/preview/
```

Assertion scripts — `playwright-core`, browser in `~/AppData/Local/ms-playwright`, dev server up, `BASE_URL` honoured.
Run the one covering the surface you touched:

```bash
node reference/ux-check.mjs        # every surface at 320/375/390/414/1440 + the interactions
node reference/interact.mjs        # cards: one link, always-visible add, toast, stepper
node reference/widest.mjs /c/x 320 # ad hoc: what is overflowing at that width
node reference/pdp-check.mjs       # PDP layout, gallery, stepper, cart round trip
node reference/chrome-check.mjs    # pinned chrome, clearances, stars
node reference/hero-check.mjs      # tabs, dots, inert slides, locked tab
node reference/search-check.mjs    # panel, keyboard, sheet, no-JS fallback
node reference/starters-check.mjs  # kit surfaces swept for claim copy
node reference/guides-check.mjs    # a credit for every cover
node reference/stock-check.mjs     # out-of-stock agrees everywhere
node reference/{auth,cart}-check.mjs   # auth and order round trips.  WRITE — scratch project
node reference/admin-check.mjs     # /admin gate, counters, beacon.  Writes, restores
```

Two traps every script inherits: **`textContent('body')` also reads RSC flight data in `<script>` tags** — "is it gone"
false-passes, use `innerText`; **navigate on `domcontentloaded`, not `networkidle`**, never reached by a page full of
prefetching links.
## Data boundary

- **`lib/catalog.ts` is the only boundary** over `catalog.generated.json` (`byCategory`, `bestSellers`, `deals`,
  `related`, `search`, `brandsIn`, `BRANDS`…). Label fields arrive structured — **nothing parses values out of titles**.
  Computed values: discount percent, `perServing`. The FX rate enters here once, via `lib/fx.ts`.
- `lib/query.ts` — filter/sort state lives in the URL (`toggleHref`/`setHref`). **Filters are links, not form controls**:
  shareable, back-navigable, no-JS.
- `lib/listing.ts` — `applyFilters`/`applySort`/`activeFilters`/`PRICE_BUCKETS`/`SORTS`/`pageSize` for `/c/[slug]`,
  `/search`, `/deals`, `/new`, `/b/[brand]`; layout `plp/product-listing.tsx`. **`relevance` returns input order
  untouched** (`/search` hands over `search()`'s scoring). Paging is `?show=` as a link at `PAGE_SIZE`.
- `lib/delivery.ts` — threshold, two methods + fees, 15:00 Bangkok cutoff, delivery/returns windows, VAT line. **No
  `server-only`**: `estimate()` runs client-side, or the date shown is the build's.
- `lib/subcategories.ts` — label + match terms per category, the `/c/[slug]` browse rail; a tile shows only when stock
  matches (`inSubcategory`) and is the `refine` param as a link.
- Also `lib/payment.ts`, `orders.ts`, `signups.ts` (`server-only`), `cart.ts`, `thailand.ts`, `product-info.ts`;
  `cart/cart-context.tsx` is the `localStorage` cart.
## Routing

- **A page reading `searchParams` cannot prerender** → dynamic listings (`/c/[slug]`, `/b/[brand]`, `/new`, `/search`,
  `/deals`, `/compare`), and no `generateStaticParams` on `/b/[brand]`: dead weight.
- SSG `/p/[slug]` (470 paths), `/guides/[slug]`. Cookie-dynamic `/signin`, `/signup`, confirmation, `/account/*`,
  `/admin/*`. Handlers `/api/{session,search/suggest,track,auth/[provider](+/callback)}`. Rest static — read `app/`.
- **`app/` splits in two: `(storefront)` and `admin`.** Root layout is the document only, `(storefront)/layout.tsx`
  renders `chrome/storefront-shell.tsx`, `/admin` wears none of it. Route groups are not URL segments, so all 470 product
  pages still prerender.
- **`app/not-found.tsx` cannot live inside the group** (it catches unmatched URLs site-wide) — it composes the shell.
- **Static-first shaped everything**: the masthead sits in `(storefront)/layout.tsx`, so awaiting `cookies()` there turns
  every storefront route dynamic and costs 470 prerenders. Hence the browser stores.
- **Server components by default**; islands are exactly the `"use client"` files — grep, don't trust a list.
## CSS and layout traps

- `chrome/sticky-chrome.tsx` pins masthead + category row (utility strip scrolls away for good). Pinned state =
  **`IntersectionObserver` on a sentinel *above* the wrapper, never a measurement of the wrapper**: sticky stays in flow,
  so condensing shortens the document and un-pins it, and a layout read in `getSnapshot` throws "Maximum update depth
  exceeded" on resize. Publishes `data-stuck` → children condense off `group-data-[stuck=true]/chrome:`. Pinned height
  `--spacing-chrome` (103px): the anchor rule, listing toolbar and buy-box offset read it.
- **Anchor offset = `scroll-margin-top` on targets, never `scroll-padding-top` on `html`** — scroll padding also applies to
  the caret reveal per keystroke, and the search field sits in sticky chrome, so it walks to the top a letter at a time.
  **A focusable control must not carry that offset.**
- **A pinned bar inside a page needs `z-40`, not less**: any z-index makes a stacking context that caps a `fixed` sheet
  inside it (`z-50` still sits behind the chrome's `z-40`). Match the chrome, come later in the document.
- **Back/forward scrolling is ours** (`chrome/scroll-memory.tsx`): the router scrolls to top while the outgoing URL is
  current, so a position taken on scroll is the router's, not the reader's — record on the link press, restore over a few
  frames on popstate.
- **A centred flex row that overflows is unreachable**, not merely clipped: first items sit at a negative offset no scroll
  reaches. `justify-center` is `lg:` only, on the browse rail.
- **`.squared` (`/account` layout) is unlayered in `globals.css`** — that is how it beats `rounded-*` and flattens shared
  components inside it while they stay rounded elsewhere. Its two-level sidebar flattens below `lg` via
  `display: contents`.
- **No product image carries a hover transform.**
- **`chrome/site-header.tsx` carries a temporary preview notice** — small red Thai ("ยังไม่เสร็จ / พรีเวิว") beside the
  lockup. **Delete before launch.**
## Search

Ranking in `lib/catalog.ts`, vocabulary in `lib/search-suggest.ts`, one island in `chrome/search-box.tsx`. **Full rules
in `reference/SEARCH.md`; read it before touching the panel, the sheet or the suggestion vocabulary.**

- **`search()` scores; it never substring-tests.** A term must **start a word** (`normalise` + `hasTermPrefix`) — that is
  what makes `vit d` work with no synonym table. Every term must match somewhere, best field per term wins, and **a term
  under three characters may match title, brand or category only**. Weights are in the function: a synchronous scan of
  470 rows.
- **Only suggest what the stock holds**: the vocabulary is counted against the pages it links to and **drops an entry at
  zero**, so it cannot drift; `didYouMean` runs **only when a query scored nothing**; brands go to `/b/[brand]`.
- **`GET /api/search/suggest?q=` must send `Netlify-Vary: query=q`** — the adapter keys caches on `__nextDataReq`/`_rsc`
  only, so the first query cached is served to every later one, invisible in `next dev`. **Any cacheable handler reading
  a search param needs it.** It is `public, max-age=300`, and panel and `/search` run the same `search()`.
- **The closed panel is unmounted, never transparent and left in flow** (that scrolls the page sideways at 375px), and
  **fetches are sequence-numbered with no in-flight deduplication** — joining an older request resolves stale.
## Design system

Tokens in `app/globals.css` under `@theme`. The palette inverts the category convention on purpose: the reference site is
green chrome with an orange button, so green chrome here would read as a clone. Logo, lockup and type rules live in
`reference/brand/README.md`.

| Role | Token | Value |
|---|---|---|
| Chrome — utility bar, nav, footer | `plum-800` / `plum-900` | `#3b1430` / `#2b0f20` |
| Accent — active nav, countdown, deal meters | `turmeric-500` | `#d08a0e` |
| Add-to-cart + compare, gradient via `btn-cart` | `cart-top` -> `cart-bottom` | `#c06d00` -> `#bc5500` |
| Review stars, nothing else | `star` | `#f5a623` |
| Volume figures ("90K bought this month") | `sold` | `#659fd9` |
| Trust only — in stock, verified, savings | `pandan-600` | `#1e5b41` |
| Markdown price | `sale-600` | `#a3123a` |
| Medical equipment — banner, glyphs | `clinic-900` -> `clinic-500`, `clinic-100` | `#0e3a6b` -> `#1b5ca7`, `#eef3f9` |
| Neutrals | `ink` `muted` `line` `paper` `paper-warm` | warm greys, `#fbf9f5` bands |
| `/admin` console only | `term-*` | `reference/ADMIN.md` |

- **One face, every job: Inter** (`--font-sans` = `--font-display`), `tabular-nums` for figures. **It carries no Thai** —
  localisation needs a second face. **`/admin` alone** loads JetBrains Mono behind `--font-term`.
- **Ratings are stars, never a numeric average on a card** (`ui/stars.tsx`); the review count is the only figure there.
- **Keep the facts strip one fixed-height line** on a card so CTAs align across a row, dose before pack size: whatever is
  second is what truncates. **Cost per serving is always printed as its arithmetic** ("our price ÷ 180 servings").
- **`product.inStock` is load-bearing**: no stepper or add on the PDP (restock form instead), no quick-add on the card,
  `add()` refuses the slug, and a line already in the cart is **kept, greyed, out of the subtotal**. `stock-check.mjs`
  asserts it agrees everywhere.
- **Product cards are one link**: `before:absolute before:inset-0` on the title link covers the card — one tab stop, text
  still selectable, no button inside an anchor; the save heart and compare box sit above at `z-20` and stop the click.
- **Add to cart sits over the foot of the photograph, revealed on hover or focus** (`.reveal-add`), so a grid at rest is
  products, not buttons; **a device with no hover keeps it permanently**. In-cart, that slot becomes the stepper under the
  same rule — the toast and masthead count are what confirm an add at rest. Card adds pass `open: false`, keeping the
  drawer off the grid. `interact.mjs` asserts both halves.
## Product page

Three columns: media, summary, sticky buy box; below the fold the jump list, **Pairs well with**, the descriptive section
and **Recently viewed**. **Full rules in `reference/PDP.md`; read it before touching the gallery, the buy box or the copy
blocks.** Four traps reach beyond the page:

- The gallery is **radio inputs + the `.gallery` rules** (no client JS, keyboard-operable, survives reload), and
  `gallery-swipe.tsx` swipes by **moving the checked radio**, **attaching by query** — wrapping the frame breaks every
  `input:checked ~ .frame` selector.
- `zoom-shot.tsx`'s pane is `fixed` to escape the frame's `overflow-hidden`, so **never put `transform`, `filter` or
  `will-change` on the frame**, and it **must stay a direct child of `.frame` in source order**.
- Copy blocks are `<details class="disclosure md-open">`, forced open from `md` by `::details-content`, with **`open` on
  Overview and Warnings** as the fallback where that selector is missing. **New copy blocks go in
  `product-information.tsx`, never beside the buy box.**
- `lib/product-info.ts` never invents: **a panel with no input renders nothing**, and `relationTo()` compares two figures
  **both** labels state or **returns null**. **No fabricated testing claims** — nothing here runs a lab, and `/quality`
  says so.
## Browser state

Six stores, one contract, no exceptions: `useSyncExternalStore` with an **empty server snapshot**, never `useState` plus an
effect (hydration mismatch, and it trips `react-hooks/set-state-in-effect`). 470 prerendered pages know nothing about the
reader: cart, session, search, recently viewed, compare, clock (pre-mount value zero, so consumers print wording, not a
date).

- **Recently viewed is twelve slugs, nothing else** — no timestamps, no counts, so not a behavioural log. `RecordViewed`
  writes it; `ViewBeacon` is the separate anonymous server-side counter. **Nothing renders below two entries.**
- **Compare holds four slugs, but the comparison is a URL** (`/compare?p=…`), so that page needs no client state. Rows key
  on the **nutrient**, not the printed string, and **a dash means the label does not state the row — never a zero.** Full
  rules in `reference/LISTINGS.md`.
## Listings, brands, mobile

Filter/sort state lives in the URL (`lib/query.ts`), `lib/listing.ts` is the shared engine, `?show=` pages at `PAGE_SIZE`
as a link. **Full rules in `reference/LISTINGS.md`; read it before touching a listing, the filter rail or a rail.**

- **`/b/[brand]` is the whole of a brand across every shelf** (46 of 134 sit on more than one); **`/new` sorts on
  `firstAvailable`**, the month the label says it first shipped, and the rail's brand group stays a filter.
- **Every viewport from 320px up is a tested width** (`ux-check.mjs`), and **a phone gets its own control, not a smaller
  desktop one**: the pinned Filter/Sort bar opens `plp/disclosure-sheet.tsx`, a native `<details>` that works before
  hydration.
- **On a phone nothing waits for hover** — reveal rules all sit in `@media (hover: hover)` — and controls clear 44px.
  Anything pinned to the bottom edge pads for `env(safe-area-inset-bottom)`; the toast, compare tray and PDP purchase bar
  step around each other there.
## Cart and checkout

The cart is `localStorage`; everything an order needs is Postgres. Drawer, `/cart`, `/checkout`, confirmation. **Full
rules in `reference/CART.md`; read it before touching a cart surface.**

- **Checkout is one page, three numbered sections, one submit** — not a wizard with the step in the URL, which would put a
  name, phone and address in the query string, and so in history and logs.
- **Prices never cross the wire.** The form posts `item` fields of `"slug:qty"` and nothing else; `app/actions/checkout.ts`
  resolves each slug through `getProduct()`, refuses out-of-stock, clamps to `MAX_QTY_PER_LINE` and recomputes every
  figure — the same principle as `/api/track`. **The address field is `line` and cart lines are `item`**: one name doing
  both jobs is how a cart line lands in an address.
- **`order_items` snapshots the product** — title, brand and unit price as columns, not a join: the catalogue is
  regenerated from a scrape and prices move with the rate, so an order must still read correctly after a slug retires.
  Money is whole-baht integers.
- **The action redirects rather than returning**, so the no-JS path lands on the confirmation; `clear-cart.tsx` empties the
  cart there **keyed on the order number**, or reopening from history wipes a cart filled since.
- **Order numbers come off a sequence** (`SWA-26-0001`), not a count, and are a guest's only credential — `orderForUser`
  matches number **and** account.
- **`proxy.ts` matches `/account` and `/admin` only**, so `/checkout` is open to guests by construction. Prices include
  VAT, nothing is added on top, and **there are no card fields anywhere**.
## Accounts, auth, reviews

Postgres holds what the catalogue cannot: accounts, sessions, reviews, saved items, addresses, orders. `DATABASE_URL` in
`.env.local` is the only secret; unset, `isConfigured()` switches the feature off rather than erroring, so a build works
with no database. **Full rules in `reference/ACCOUNTS.md`; read it before touching auth, sessions, the sign-in flow,
OAuth or anything under `/account`.**

- `lib/db.ts` — **one `pg` pool on `globalThis`**, or `next dev` leaks a socket set per hot reload. TLS verified
  (localhost excepted). **Every statement is parameterised**; a placeholder used twice needs an explicit `::type`.
- **`lib/password.ts` stores `scrypt$N$r$p$salt$hash`** so cost can be raised without invalidating anyone, and
  **`lib/session.ts` keeps only the SHA-256 of the cookie's 32 random bytes**, so a dumped row cannot be replayed.
- `lib/dal.ts` — `getUser()` (React `cache`d, two-field DTO, **never the row**) and `requireUser()`; **all per-user reads
  go through here, not the cookie**. **Its catch calls `unstable_rethrow` first**: a prerender cookie read throws a
  framework signal meaning "render at request time", and swallowing it renders the page signed out.
- **Nothing under `/account` sets `force-dynamic`** — the cookie read already makes it dynamic, and forcing it stops
  `refresh()` from an action updating the page in place. `proxy.ts` (Next 16's renamed middleware) only checks a cookie
  exists; **it is not a gate**.
- **Every action in `app/actions/*.ts` re-verifies the session** — a Server Action is a POST endpoint anything can call.
- `account-store.ts` — the session as a store, filled from `GET /api/session` after mount. Consumers render signed-out
  until it says otherwise and **none of them is a permission check.** `session-sync.tsx` re-reads on pathname change,
  **sequence-numbered with no in-flight dedup**, as Search does.
- **`/p/[slug]` reads reviews through `unstable_cache` tagged `reviews:<slug>`**, so anonymous traffic never reaches
  Postgres. Posting calls **`updateTag()`, not `revalidateTag()`** — which serves the writer the stale copy their own
  review is missing from — then `refresh()`.
- **Auth actions do not `redirect()`**: they return where to go and the form navigates, fields held in state so a
  rejected password does not empty the form. (Checkout is the exception, and says why.)
- **OAuth replaces none of this** (`lib/oauth.ts`, `/api/auth/[provider]` + `/callback`): providers are data and one
  whose credentials are unset **does not appear**; `state` lives in a short-lived httpOnly cookie and is compared
  **constant-time**; **PKCE sends only the verifier's SHA-256**; the cookie is **`SameSite=Lax`, not Strict**; **accounts
  link on a verified email and nothing else**, an unverified match being refused outright; and **nothing in the query
  string is treated as who somebody is**.
- **The honesty rule**: `product.rating`/`product.reviews` are the source listing's aggregate, reviews written here are
  ours — **two labelled figures, never averaged into one**, and per-star bars count real rows, not a curve fitted to the
  source average.
## Internal dashboard

`/admin` — a private, read-only survey for a named few. **Full rules in `reference/ADMIN.md`; read it before touching
`/admin`, `lib/admin.ts`, `lib/analytics.ts` or `/api/track`.**

- **The gate is `lib/admin.ts`, an env allowlist** (`ADMIN_EMAILS`), checked after the ordinary sign-in; **unset means
  nobody**. `requireAdmin()` answers a signed-in non-admin with **`notFound()`, not 403**, and **every page calls it for
  itself** — `proxy.ts` only checks a cookie exists and is not the gate.
- **Nothing here verifies an email address** (the site sends no mail), so whoever registers an allowlisted address first gets
  in: **create the accounts, then add the addresses.**
- **Read-only by construction**, and the counters answer "how many", never "who": no visitor id, no cookie, no IP, no
  per-event row. **`POST /api/track` is the only writer**, validating every key against something the server already knows,
  **never the request body**.
## Home page

`home-hero.tsx` is the server half and the only importer of `lib/catalog.ts`; `hero-carousel.tsx` is the only client
component above the fold. **Full rules in `reference/HERO.md`; read it before touching the hero or the bands under it.**
Three that bite from outside:

- **Slide and band photographs are imported — never `existsSync` against `public/`**: that check runs wherever the page
  renders, so a host with no real filesystem answers false for a deployed, serving file and the slide ships blank. **A
  missing file must be a build error.** Same in `trust-band.tsx`.
- Slides stay mounted for a stable height and carry **`inert` unless on screen**, or an off-screen CTA is a tab stop for a
  slide nobody sees. **No pause control** — hover is the only stop, the site's one WCAG 2.2.2 miss — and nothing rotates
  under `prefers-reduced-motion`.
- **Medical equipment is locked** by `locked` on its `TABS` entry: `aria-disabled` + a no-op press, **not `disabled`**,
  which takes no pointer events and loses the cursor and title that say why.
## Starter kits

`/starters` + the band under the hero. **Full rules in `reference/STARTERS.md`; read it before touching a kit surface.**

- **Kits are composed by rule, not by slug** (`lib/starters.ts`): roles filled with the best-selling in-stock match, so a
  catalogue refresh re-resolves instead of pointing at a dead product. An unfillable role is dropped, **a kit under two
  items is not published**, and the home band shows kits, not their bottles as a product rail.
- Audience is 16+ and the guardrails are code: **`EXCLUDED` keeps children's lines and the whole `kids` category out** —
  hence no kit leads on format — and melatonin is out while staying on the sleep shelf.
- **No claim copy, and value figures are real numbers only.** `starters-check.mjs` sweeps both surfaces for weight-loss,
  focus and exam-result phrasing, skipping `#what-we-wont-do`, the one block allowed to name those claims.
## Guides

Six articles as **structured data in `lib/guides.ts`** — no markdown renderer, nothing to sanitise. **Full rules in
`reference/GUIDES.md`.**

- **Nothing links an article to a product by hand**: `guideMentions()` matches an article's own term bullets against
  stock whose **title** opens a word with that term (`hasTermPrefix`, as `search()`), dropping what the catalogue cannot
  answer.
- **`guides-check.mjs` asserts a credit for every cover** — a missing one puts a CC BY image out of licence — and no
  sentence claims a laboratory or a study the site cannot show.
## Catalogue data

`reference/iherb/` is three stages: `discover` -> `urls.json`, `harvest` -> `products/<pid>.json` + images, `build` ->
`lib/catalog.generated.json`. **Read `reference/iherb/README.md` before touching it** — the bot check dictates the
design, it lists field by field what is real and what is ours, and **stage 3 does all interpretation**, so changing how a
field is read is a `build.mjs` edit plus a rerun, never a re-scrape.

- Nothing on `Product` is invented: only discount percent and `perServing` are **computed from two real numbers**, the
  price is **restated at today's rate**, and the handling standards + site disclaimer are **ours**.
- **A field the source does not state arrives as `null` or an empty array, and its panel renders nothing.** Keep that
  when adding fields: it is what stops the page claiming a %DV or best-by date no label backs.
## Currency

Stored prices are iHerb's harvest-day THB; `lib/fx.ts` restates them at today's rate, applied once in the mapper, so
every surface sees plain THB. **Full rules in `reference/FX.md`; read it before changing `HARVEST_MARKET_RATE`** — it is
the *market* rate on the harvest date, not the rate iHerb charged, and confusing the two shaves the spread off every
price.

- **Prices round up to the whole baht** (`Math.ceil`): none moves by more than ฿1, none sits below what it converts to,
  and there is no charm pricing.
- **The rate is a committed build input, not a runtime lookup** — `lib/catalog.ts` is synchronous and imported by every
  page. `reference/fx.mjs` reads the ECB rate, **refuses anything outside 25-45**, and **writes only on a move over
  0.5%**.
## Reference material and git

- `reference/NOTES.md` — measured iHerb tokens, per-page anatomy, what was deliberately not copied.
- Per-surface rules, each read before touching that surface: `ADMIN.md`, `HERO.md`, `ACCOUNTS.md`, `SEARCH.md`,
  `STARTERS.md`, `GUIDES.md`, `FX.md`, `PDP.md`, `CART.md`, `LISTINGS.md`, `brand/README.md`, `iherb/README.md`.
- `reference/shots/` — source screenshots, re-captured by `reference/capture.mjs`.
- Own repository, on `main`, pushed to `github.com/gregorton/nutriva`.
