@AGENTS.md

# CLAUDE.md

## What this project is

**Slim Wellness Asia** — a supplement storefront for the Thai market: English UI copy, ฿ THB pricing, delivery from
Bangkok. Catalogue is real product data harvested from `th.iherb.com`; page structure, design system and components
are ours. Name and logo are the client's.

Structure and navigation take after `th.iherb.com` (dense grids, utility strip, category nav, deal rail, trust band).
The visual identity deliberately does not — see Design system.

## Commands

```bash
npm run dev        # Turbopack dev server on :3000
npm run build      # one prerendered route per product plus the static pages
npm run lint
npx tsc --noEmit
npx next typegen   # regenerate PageProps/LayoutProps types after adding a route
```

```bash
# refresh the catalogue (stage 2 is long and resumable)
node reference/iherb/discover.mjs && node reference/iherb/harvest.mjs && node reference/iherb/build.mjs
node reference/fx.mjs --force      # force a reprice; a scheduled workflow normally does this
node reference/db/migrate.mjs && node reference/db/seed.mjs   # needs DATABASE_URL in .env.local
node reference/brand/icons.mjs     # re-derive lockup + icons from the square logo
node reference/editorial/photos.mjs [--candidates <slug>]     # guide covers
node reference/shoot.mjs label     # screenshot dev server -> reference/preview/
```

Assertion scripts — `playwright-core` against the browser in `~/AppData/Local/ms-playwright`; all need the dev
server up, all take `BASE_URL`. Run the one covering the surface you touched:

```bash
node reference/interact.mjs        # cards: one link, hover-reveal add
node reference/pdp-check.mjs       # PDP layout, stepper, cart round-trip, colour rules
node reference/chrome-check.mjs    # pinned chrome, clearances, stars without a numeral
node reference/hero-check.mjs      # tabs, wrapping, dots, inert slides, locked tab
node reference/starters-check.mjs  # kit surfaces swept for claim copy
node reference/guides-check.mjs    # a credit exists for every cover
node reference/search-check.mjs    # panel, keyboard, phone sheet, no-JS fallback
node reference/stock-check.mjs     # out-of-stock: buy box, card, filter and cart agree
node reference/auth-check.mjs      # auth round trip.  WRITES — use a scratch project
node reference/cart-check.mjs      # cart -> checkout -> order row.  WRITES — scratch project
node reference/admin-check.mjs     # /admin gate, counters, beacon.  Writes, then restores
```

## Architecture

Next.js 16.3 App Router, React 19, Tailwind v4, TypeScript. Two data sources, no other backend: the static catalogue
module, and PostgreSQL for what visitors write.

- `lib/catalog.ts` — the single data boundary over `catalog.generated.json` (`byCategory`, `bestSellers`, `deals`,
  `related`, `search`, `brandsIn`, `BRANDS`…). Label fields arrive structured; nothing parses values out of titles.
  Only computed values: discount percent and `perServing` (read by no surface).
- `lib/fx.ts` — the one place an exchange rate enters; the mapper calls `adjust()` on every price.
- `lib/query.ts` — filter/sort state lives in the URL; `toggleHref`/`setHref` build the next URL, so filters are
  links, not form controls: shareable, back-navigable, work without JS.
- `lib/listing.ts` — `applyFilters` / `applySort` / `activeFilters` / `PRICE_BUCKETS` / `SORTS`, once, for
  `/c/[slug]`, `/search`, `/new` and `/b/[brand]`; `components/plp/product-listing.tsx` is the matching layout.
  **`relevance` returns the input order untouched**: `/search` hands over what `search()` scored.
- `lib/delivery.ts` — threshold, the two methods and fees, the 15:00 Bangkok cutoff, delivery windows and the
  returns window, in one place because three components used to retype them as prose. `estimate()` derives an
  arrival date. No `server-only`: the estimate is a client island (a prerendered page would bake the date in).
- `lib/payment.ts`, `lib/orders.ts`, `lib/signups.ts` (`server-only`), `lib/cart.ts`, `lib/thailand.ts` — see Cart
  and checkout.
- `lib/subcategories.ts` — label + match terms per category, behind the browse rail atop `/c/[slug]`. A tile shows
  only when stock matches it; it is the `refine` param as a link, filtered by `inSubcategory`.
- `components/cart/cart-context.tsx` — cart in `localStorage`; see Browsing state in the browser.
- Routes: `/`, `/c/[slug]` and `/b/[brand]` and `/new` and `/search` and `/compare` (dynamic —
  searchParams), `/p/[slug]` (SSG, 470 paths), `/starters`, `/deals`, `/equipment`, `/brands`,
  `/guides` + `/guides/[slug]` (SSG), `/cart`, `/checkout`,
  `/checkout/confirmation/[orderNo]`, `/help/{delivery,returns,contact}`, `/quality`, `/sourcing`,
  `/careers`, `/legal/{privacy,terms,cookies}`, `/signin`, `/signup`, `/account` + `/account/orders`
  (+ `/[orderNo]`) + `/account/saved` + `/account/reviews` (dynamic — cookie), `/admin` +
  `/admin/accounts` + `/admin/orders` + `/admin/reviews` + `/admin/products` + `/admin/search`
  (dynamic — cookie), `/api/session`, `/api/search/suggest`, `/api/track`, `not-found`.
- **A page that reads `searchParams` cannot prerender.** That is why the listing pages are dynamic
  and why `/b/[brand]` carries no `generateStaticParams` — it would be dead weight. `/brands` and the
  policy pages have no search params and are static.
- **`app/` is split in two: `(storefront)` and `admin`.** Root layout is the document only. `(storefront)/layout.tsx`
  renders `chrome/storefront-shell.tsx` (utility bar, pinned chrome, `main`, footer, cart drawer, compare tray);
  `/admin` sits beside the group and wears none of it. Route groups do not appear in URLs, so all 470 product pages
  still prerender. `app/not-found.tsx` **cannot** live inside the group — it catches unmatched URLs site-wide — so
  it composes the same shell.
- `components/chrome/sticky-chrome.tsx` — pins masthead + category row; the utility strip scrolls away for good.
  Pinned state is measured off layout (`getBoundingClientRect().top <= 0`) through `useSyncExternalStore` and
  published as `data-stuck`, so children condense off `group-data-[stuck=true]/chrome:` (masthead 72px -> 58px,
  mobile search row folds away). Pinned height is `--spacing-chrome` (103px), read by the anchor
  `scroll-margin-top` rule and the buy box's sticky offset.
- **The anchor offset is `scroll-margin-top` on the targets, never `scroll-padding-top` on `html`** — scroll padding
  also applies to the caret reveal after each keystroke, and the search field sits inside sticky chrome, so that
  reveal can never be satisfied and the field walks the page to the top one letter at a time. **A focusable control
  must not carry that offset.**
- **`components/chrome/site-header.tsx` carries a temporary preview notice** — small red Thai
  ("ยังไม่เสร็จ / พรีเวิว") beside the lockup. **Delete before launch.**
- Everything is a server component except the cart and cart page, checkout form, category-nav panel, sort select,
  countdown, rail scroller, sticky chrome, PDP zoom, hero carousel, delivery estimate, recently-viewed and compare
  islands, the account sidebar (it marks the current section), and the account/review/save islands.

## Search

Ranking in `lib/catalog.ts`, suggestion vocabulary in `lib/search-suggest.ts`, one client island in
`components/chrome/search-box.tsx`.

- **`search()` scores; it never substring-tests.** A term must **start a word** (`normalise` + `hasTermPrefix`) —
  that is what makes `vit d` work with no synonym table. Every term must match somewhere; best field per term scores
  title 10, brand 7, category 5, label fields 2, then +8 whole phrase in title, +6 title opens with it, +1 in stock,
  tie-break `sold30d` then `reviews`. **A term under three characters may only match title, brand or category.**
  Plain synchronous scan of 470 rows.
- **Only suggest what the stock holds.** `lib/search-suggest.ts` (`server-only`) builds its vocabulary from what the
  repo already declares (`CATEGORIES[].chips`, `groupLabels()`, `brandsIn`, `formsIn`), counts each entry against the
  page it links to and **drops it at zero**, so it cannot drift. `didYouMean` is a Levenshtein pass over that
  vocabulary, used **only when a query scored nothing**; the results page renders the same guess from the same module.
- **`GET /api/search/suggest?q=` is the seam**, cached `public, max-age=300`, so panel and results page run **the
  same `search()`**. **It must send `Netlify-Vary: query=q`** — Netlify's adapter keys caches on `__nextDataReq` and
  `_rsc` only, so the first query cached was served to every later one (invisible in `next dev`). Any cacheable
  handler reading a search param needs it.
- **One combobox, three placements**: anchored panel from `sm` up, phone search row, full-screen sheet below `sm`
  (a dropdown there fights the 103px chrome and the keyboard). Sheet state lives in the store module, not React
  context, because the placements sit in three parents, and **the sheet is mounted by the icon trigger, not the
  row**, which folds away when the chrome pins. Every section flattens into **one flat `rows` array**, so arrow
  keys, `aria-activedescendant`, Enter and the live count never learn how many sections exist; sections are
  `role="group"` and focus stays in the input. **The closed panel is unmounted, never a transparent one left in
  flow** — the `hint.tsx` sideways-scroll bug, asserted at 375px. Each placement is a real GET
  `<form action="/search">`, so it works before hydration and with JS off.
- **Fetches are sequence-numbered, and in-flight deduplication must not come back** — joining an older request
  resolves with a stale answer. 120ms debounce, an `AbortController` per request, a `Map` of query to response so
  backspacing is instant. Previous rows stay while the next request is in flight; the panel never flashes empty.

## Design system

Tokens live in `app/globals.css` under `@theme`. The palette inverts the category convention on purpose — the
reference site is green chrome with an orange button, so green chrome here would read as a clone.

| Role | Token | Value |
|---|---|---|
| Brand chrome (utility bar, nav, footer accents) | `plum-800` / `plum-900` | `#3b1430` / `#2b0f20` |
| Secondary accent — active nav, countdown digits, deal meters | `turmeric-500` | `#d08a0e` |
| Add-to-cart and nothing else — a gradient, via `btn-cart` | `cart-top` -> `cart-bottom` | `#c06d00` -> `#bc5500` |
| Review stars and nothing else | `star` | `#f5a623` |
| Volume figures ("90K bought this month") | `sold` | `#659fd9` |
| Trust semantics only (in stock, verified, savings) | `pandan-600` | `#1e5b41` |
| Markdown price | `sale-600` | `#a3123a` |
| Medical-equipment side (banner field, glyphs) | `clinic-900` -> `clinic-500`, `clinic-100` | `#0e3a6b` -> `#1b5ca7`, `#eef3f9` |
| Neutrals | `ink` `muted` `line` `paper` `paper-warm` | warm greys, `#fbf9f5` bands |
| Internal dashboard console, `/admin` only | `term-950` … `term-cyan`, `term-alert` | `#05080f` … `#4fd1e0`, `#ff7a89` |

- **One face, every job: Inter**, behind both `--font-sans` and `--font-display`; size, weight and tracking do the
  work, `tabular-nums` aligns figures. Inter carries no Thai — localisation needs a second face. **The one exception
  is `/admin`**, which loads JetBrains Mono behind `--font-term` on that route only.
- **The logo is the client's artwork: placed, not drawn.** `components/chrome/logo.tsx` sets one `Image`; every
  shipped asset derives from `public/logos/slim-wellness-asia-square.png` via `reference/brand/icons.mjs` — a
  transparent lockup, plus `app/icon.png` / `app/apple-icon.png` on white (thin gold strokes vanish against a dark
  tab). The lockup is stacked, so size it **by height alone**, never width. The 250px source is a raster; ask the
  client for the vector.
- **Ratings are stars everywhere** (`ui/stars.tsx`), filled by a clipped overlay so 4.8 shows a part-filled fifth.
  **Cards carry no numeric average** — only the review count follows the stars.
- **The signature device is the facts strip** — a back-of-bottle spec row on every card
  (`components/product/facts-strip.tsx`), opened out on the PDP into `pdp/at-a-glance.tsx` and
  `pdp/supplement-facts.tsx`. Keep the card version **one fixed-height line** so card CTAs align across a row.
  Its right-hand slot holds the compare checkbox.
- **`product.inStock` is honoured everywhere, and that is load-bearing.** The buy box used to ignore it, so the
  twelve unavailable products showed "In stock, packed in Bangkok" and a live add beside a summary reading "Out of
  stock". Now: no stepper or add on the PDP, a restock form instead; no quick-add on the card; `add()` refuses the
  slug; a line already in the cart is **kept, greyed and left out of the subtotal**. `stock-check.mjs` asserts it.
- **Cost per serving is gone from the storefront — do not reintroduce it.** Computed, not stated by any label.
- **Product cards are one link**: one absolutely-positioned anchor (`before:absolute before:inset-0` on the title
  link) covers the card — one tab stop, text stays selectable, no button nested in an anchor. Add to cart, the save
  heart and the compare box layer above at `z-20` and stop the click; the add is revealed on hover/focus
  (`.reveal-add`), always shown on devices without hover.

## Product page anatomy

Three columns: media, summary (flag -> title -> brand -> rating -> stock and momentum -> pack size -> at a glance
-> one cross-sell -> rankings), sticky buy box. Below the fold: **Pairs well with**, the descriptive section, then
**Recently viewed** — alternatives before a wall of label copy.

- `pdp/product-gallery.tsx` — one view per shot, max four, switched by radio inputs and the `.gallery` rules in
  `globals.css`: no client JS, keyboard-operable, survives reload.
- `pdp/zoom-shot.tsx` — lens over the region under the pointer plus a pane beside the frame at the source file's
  resolution (900px, ~2.3x). The pane is `position: fixed` to escape the frame's `overflow-hidden`, which holds only
  while no ancestor creates a containing block — **never put `transform`, `filter` or `will-change` back on the
  frame**. Inactive shots are `visibility: hidden`, so no active-index state is needed, and it **must stay a direct
  child of `.frame` in source order**. Off below 1024px and for touch. **No product image carries a hover
  transform.**
- `pdp/product-information.tsx` — 14/10 split: Overview, Specifications, Suggested use, Other ingredients,
  Warnings, Storage, Disclaimer left, `supplement-facts.tsx` right. **New copy blocks go here**, never beside the
  buy box.
- `lib/product-info.ts` — selection and fallback for that copy, never invention: a derived-but-true line stands in
  where a product states no overview, directions or warnings; panels with no input render nothing. Its `packLabel`
  is shared by the pack tiles, the cart line and the compare table.
- `pdp/buy-box.tsx` — price, markdown, free-delivery threshold, arrival estimate, stepper capped at
  `MAX_QTY_PER_LINE`, `btn-cart`, and the out-of-stock branch. Subscription, BNPL and "see price in cart" are
  deliberately absent — nothing supports them.
- **No fabricated testing claims** — the lot strip, per-lot buy-box copy and the invented "two-lab lot release"
  standard are gone; nothing behind the storefront runs a lab, and `/quality` says so. Label marks stay.
- The Reviews block is real, from PostgreSQL: two ratings side by side, **never averaged together**.

## Browsing state in the browser

Six external stores, one contract, no exceptions: `useSyncExternalStore`, an **empty server snapshot**, never
`useState` plus an effect (hydration mismatch, and it trips `react-hooks/set-state-in-effect`). They exist because 470
product pages are prerendered and a prerendered page cannot know anything about the reader.
`cart-context.tsx` · `account/account-store.ts` · `chrome/search-store.ts` ·
`product/recently-viewed-store.ts` · `product/compare-store.ts` · `ui/clock-store.ts`.

- **Recently viewed** is twelve slugs and nothing else — no timestamps, no counts, so it is not a behavioural log.
  Written by `RecordViewed` on the PDP, separate from `ViewBeacon`: that increments an anonymous server counter, this
  never leaves the browser. The rail renders nothing below two entries.
- **Compare** holds up to four slugs, but the comparison itself is a URL (`/compare?p=…&p=…`), so it is shareable
  and that page needs no client state. Rows are keyed on the **nutrient**, not the printed string — two labels
  write the same magnesium differently, and keying on the string put them on two rows with a dash each; each cell
  keeps its own label's wording underneath. **A dash means the label does not state the row; never a zero.**
- **The clock** exists so an arrival date can be shown at all: a date rendered on the server is the date the build
  ran. Zero is the pre-mount value; the consumer renders wording instead.

## Brands, new arrivals, listings

- **`/b/[brand]`** is the whole of a brand, across every shelf. The old brand link was `/c/[category]?brand=…`,
  one shelf's slice of a brand that may sit on ten — 46 of the 134 span more than one, and California Gold
  Nutrition spans all ten. `brandSlug` and `BRANDS` live in `lib/catalog.ts`: a name-to-URL mapping is catalogue
  knowledge. `/brands` indexes them; without it each page had one entry point.
- **`/new`** sorts on `firstAvailable`, the month the label says the product first shipped — set on all 470, 140 of
  them 2025–26. New to the market, not to the warehouse; the kicker says so.
- The rail's **brand group stays a filter**: scoping a category is a different job from browsing a brand.

## Cart and checkout

The cart is `localStorage`; everything an order needs is Postgres. Drawer, then `/cart`, then `/checkout`, then
`/checkout/confirmation/[orderNo]`.

- **Checkout is one page, three numbered sections, one submit** — deliberately not a wizard with the step in the
  URL, the way the rest of the site carries state. Carrying a half-finished checkout between steps means a name,
  phone and address in the query string, where it lands in history and in logs, or a draft in `localStorage`.
- **Prices never cross the wire.** The form posts `item` fields of `"slug:qty"` and nothing else;
  `app/actions/checkout.ts` resolves each slug through `getProduct()`, refuses out-of-stock, clamps to
  `MAX_QTY_PER_LINE` and recomputes every figure — the same principle as `/api/track`. The address field is `line`
  and cart lines are `item`: one name doing both jobs is how a cart line lands in an address.
- **`order_items` snapshots the product** — title, brand and unit price as columns, not a join. The catalogue is a
  generated module rebuilt from a scrape and prices move with the rate, so an order must keep reading correctly
  after a slug is retired. Money is whole-baht integers.
- **The action redirects rather than returning**, so the no-JS path lands on the confirmation too — which is why
  `components/checkout/clear-cart.tsx` empties the cart there, keyed on the order number so reopening from history
  cannot wipe a cart filled since.
- **Order numbers come off a sequence** (`SWA-26-0001`), not a count, and are a guest's only credential for their own
  order. `orderForUser` matches number **and** account.
- **`lib/payment.ts` describes methods as data**, as `lib/oauth.ts` does providers: a method whose details are
  unset **does not appear**, so bank transfer and PromptPay are absent until the client's account lands and the
  panel says so. Cash on delivery needs no details, so it is on by default (`SWA_COD=off` withdraws it) and keeps
  checkout completable. **There are no card fields anywhere.** `ui/payment-marks.tsx` reads the same module.
- **`proxy.ts` matches `/account` and `/admin` only**, so `/checkout` is open to guests by construction. Fees and the
  VAT line are business inputs in `lib/delivery.ts`; prices include VAT, so nothing is added on top.
- `/admin/orders` reports **ordered** value, not paid.

## Accounts and reviews

PostgreSQL on Neon holds what the catalogue cannot — accounts, sessions, reviews, saved items. `DATABASE_URL` in
`.env.local` is the project's only secret; unset, `isConfigured()` in `lib/db.ts` switches the feature off rather
than erroring, so a build works with no database.

- `lib/db.ts` — one `pg` pool on `globalThis`, or `next dev` leaks a socket set per hot reload. TLS verified
  (localhost excepted). **Every statement is parameterised**; a placeholder used twice needs an explicit `::type`
  (see the lockout update in `lib/accounts.ts`).
- `lib/schema/*.sql` + `reference/db/migrate.mjs` — numbered migrations, one transaction each, recorded in
  `schema_migrations` so re-running is a no-op. `seed.mjs` picks products off the real catalogue.
- `lib/password.ts` — scrypt from `node:crypto`, stored `scrypt$N$r$p$salt$hash` so cost can be raised without
  invalidating anyone. No `server-only`: `seed.mjs` imports it too.
- `lib/session.ts` — cookie carries 32 random bytes, the table stores only their SHA-256, so a dumped row cannot be
  replayed. `secure` is production-only or the cookie never sets over localhost.
- `lib/dal.ts` — `getUser()` (React `cache`d, two-field DTO, never the row) and `requireUser()`; everything touching
  per-user data goes through here, not the cookie. Its catch calls `unstable_rethrow` **first** — a prerender cookie
  read throws a framework signal meaning "render at request time", and swallowing it renders the page signed out.
- **Nothing under `/account` sets `force-dynamic`** — the cookie read already makes it dynamic, and forcing it stops
  `refresh()` from an action updating the page in place. `proxy.ts` (Next 16's renamed middleware) only checks that a
  cookie exists.
- `lib/accounts.ts`, `lib/reviews.ts`, `lib/saved.ts` query; `app/actions/*.ts` mutate, and **every action
  re-verifies the session**: a Server Action is a POST endpoint anything can call.

**Keeping the site static shaped all of it** — the masthead is in `app/(storefront)/layout.tsx`, so awaiting
`cookies()` there would turn every storefront route dynamic and cost all 470 product pages their prerender.
Consequences, none optional:

- `components/account/account-store.ts` — the session as a store, filled from `GET /api/session` after mount.
  `account-button.tsx`, `review-form.tsx` and `product/save-button.tsx` render signed-out until it says otherwise.
  **None is a permission check.**
- `components/account/session-sync.tsx` re-reads the session on pathname change, because signing in navigates
  before client code gets a say. Refreshes are **sequence-numbered**; **do not reintroduce in-flight
  deduplication**, which let a stale reply overwrite a newer one.
- `/p/[slug]` reads reviews through `unstable_cache` tagged `reviews:<slug>`, so anonymous traffic gets built HTML and
  never reaches Postgres. Posting calls **`updateTag()`, not `revalidateTag()`** (which serves the writer the stale
  copy their own review is missing from), then `refresh()`.
- Auth actions **do not `redirect()`**: they return where to go and the form navigates, fields held in state so a
  rejected password does not empty the form. (The checkout action is the exception, and says why.)
- Review paging is a server function with a cursor (`pdp/review-more.tsx`), not `?page=` — reading `searchParams`
  would make all 470 pages request-time. Keyset on `(created_at, id)`.

**One flow, two steps.** `/signin` and `/signup` are the same two screens on two paths (`account/auth-flow.tsx`
picks, `auth-steps.tsx` holds step two): an address, then a password if it has an account, or a name and new
password if not.

- **`accountExists()` is a deliberate hole in that file's rule 2** — two different second screens confirm whether an
  address is registered however they are worded. The lockout is untouched.
- **The step is in the URL, not state** — Continue is a plain GET form landing on `?email=…`, looked up on the
  server: step one needs no JS, Back/Change are ordinary links, a reload stays put.
- The strength meter scores four rules but **gates on only the two `checkRegistration` enforces**, so it never
  blocks a password the server would take.
- **Your name** is the one field the reference flow lacks: reviews are attributed by display name.
- Providers appear on step one only, where "sign in" and "create an account" are the same press.

**The honesty rule.** `product.rating`/`product.reviews` are the source listing's aggregate; reviews written here
are ours. Two labelled figures, **never averaged into one**. `ratingBreakdown()`, which fitted a curve to the source
average to draw per-star bars, is **deleted**: bars count real rows.

**Google / Facebook sign-in replaces none of it**: a provider is another way to reach `startSession()`. `lib/oauth.ts`
describes one authorization-code flow as data, an entry per provider; `/api/auth/[provider]` starts it,
`.../callback` finishes it. No client JS.

- **A provider whose credentials are unset does not appear** (`configuredProviders()` reads the env).
- `state` is random, in a short-lived httpOnly cookie, compared constant-time on return. PKCE keeps the verifier
  there and sends only its SHA-256 (Google requires it; Facebook is inconsistent, so it is a per-provider flag, off
  there). The code is exchanged server-to-server, identity comes from the provider's own endpoint, and **nothing in
  the query string is treated as who somebody is**. `?next=` goes through the local-path check.
- **Accounts link on a verified email and nothing else.** `linkOrCreateAccount` tries the `identities` row, then a
  *verified* address on an existing account, then creates one. An unverified match is **refused outright** —
  otherwise somebody registers your address at a provider that does not check it and walks into your account. A
  Facebook account with no email gets one here with none: `users.email` and `password_hash` are both nullable, and
  `authenticate()` refuses a row without a password.
- The cookie is `SameSite=Lax`, not Strict: the provider returns people with a top-level GET that Strict would not
  attach it to, leaving the callback nothing to check `state` against.
- Failures return `/signin?error=<reason>`; the page turns each reason into something readable.

Two traps every assertion script inherits: `page.textContent('body')` also reads the RSC flight data Next embeds in
`<script>` tags, so "is it gone" is a false pass — use `innerText`; and navigate on `domcontentloaded`, not
`networkidle`, because a page with many prefetching links need not settle.

## Internal dashboard

`/admin` — a private, read-only survey for a named few: overview, accounts, orders, reviews, products, search.

- **The gate is `lib/admin.ts`, an env allowlist.** `ADMIN_EMAILS`, comma-separated, checked after the ordinary
  sign-in. Unset means nobody and `/admin` 404s for everyone; revoking is an env edit. `requireAdmin()` sends a
  stranger to `/signin` and answers a signed-in non-admin with **`notFound()`, not 403**. Every page calls it for
  itself.
- **Nothing here verifies an email address** — the site sends no mail at all — so whoever registers an allowlisted
  address first gets in. **Create the accounts, then add the addresses.**
- `isAdmin()` lets only a boolean out, holding `lib/dal.ts`'s rule that no email reaches a component.
  `/admin/accounts` is the one surface that displays an address.
- **Read-only by construction** — no action, no form, no mutation, so a leaked admin session cannot damage.
  `proxy.ts` matches `/admin` only for the cookie-presence check: it is not the gate.
- `/admin` sits **outside** `(storefront)`, so the only layout above it is the document — a title bar, shell
  prompt, lowercase tabs and a status line stand in, and the two links in that title bar are the only way out.
  **Nothing here uses the brand palette** except `turmeric-500`, `sold` and `star`, and
  **JetBrains Mono is loaded in `app/admin/layout.tsx`, not the root layout**, binding
  `--font-jetbrains` which `@theme` reads through `--font-term` — a separate token, so the storefront keeps Inter.
- Charts are hand-rolled inline SVG (`components/admin/bar-chart.tsx`) stretched with
  `preserveAspectRatio="none"`, so every bar must stay a plain rect — corners, strokes and text distort with it.

**The counters** are `lib/schema/003_analytics.sql`, written by `lib/analytics.ts`, read by `lib/admin-stats.ts`:
`product_views`, `page_views`, `search_queries`, each a `(thing, day)` key over an integer bumped by one upsert. No
visitor id, no cookie, no IP, no per-event row — they answer "how many", never "who".

- **`day` is Bangkok's, never `current_date`** — the Neon branch runs in GMT, so the two disagree for the first seven
  hours of every Thai day and the evening peak files under yesterday. The zone is a parameter,
  `(now() at time zone $n::text)::date`, and the constant lives in `lib/delivery.ts`.
- **`POST /api/track` is the only writer, and every key is validated against something the server already knows**:
  a slug through `getProduct()`, a surface against a fixed set, the result count from `search()` — **never from the
  request body**. It answers 204 to everything. No CSRF token: a forged call can only nudge an anonymous counter.
- **Anyone on the allowlist is excluded from every counter** — `/api/track` calls `isAdmin()` and drops the write,
  so the people who open every page while building the shop cannot inflate the figures they read. Hence the beacon's
  fetch must keep its default `credentials: "same-origin"`.
- **`view-beacon.tsx` is a client island because the counted pages must stay prerendered** — a server-side insert in
  `/p/[slug]` would break the prerender or never run again. A module-level `Set` dedupes per JS context, and there is
  deliberately **no `AbortController`**: unmount is the navigation being recorded.
- **Search is counted on a submitted `/search` only** — `/api/search/suggest` is CDN-cached and never reaches the
  origin, so keystrokes cannot be logged even in principle. **The queries that returned nothing are the point.**
- Averages on `/admin/products` count **our** reviews only. `sold30d` appears nowhere: it describes trade at the
  source, not here.
- `admin-check.mjs` and `stock-check.mjs` are safe against the real project; `auth-check.mjs` and `cart-check.mjs`
  write. `admin-check.mjs` needs `ADMIN_EMAILS=admin-check@slimwellness.test` or its dashboard half SKIPs.

## Home hero

`components/home/hero-carousel.tsx` — the only client component above the fold — holds two tabs, each with its own
slideshow. `home-hero.tsx` is the server half and the only one that imports `lib/catalog.ts`. They meet at the types
in `hero-slides.ts`.

- **The pill switches topic, the arrows move within it.** Supplements runs the shelves off `CATEGORIES`; Medical
  equipment runs four ranges from `equipment-glyphs.tsx` as line art — no prices, no catalogue behind it.
- **No arrow crosses to the other topic, and it wraps both ways**, so no button ever disables itself — one that
  does so as it fires hands keyboard focus back to the document.
- **It rotates on its own** (`ROTATE_MS`, 6.5s), `held` while the pointer is over the banner or focus is inside,
  never started under `prefers-reduced-motion`. **No pause control** — hovering is the only stop, the one place the
  hero misses WCAG 2.2.2. The timer is keyed on the position, so an arrow or dot restarts the clock.
- **Medical equipment is locked** by `locked` on its `TABS` entry; the tab still shows. `aria-disabled` with a
  no-op press, **not** `disabled` — that gets no pointer events, losing the cursor and title that say why.
- **Two nested tracks, not one** — flat, a tab switch animates through intervening slides. **Each tab keeps its own
  position**; every slide stays mounted for a stable height and carries **`inert` unless on screen**, or an
  off-screen CTA is a tab stop for a slide nobody can see.
- **The control cluster is one pill from `sm` up and two stacked rows below** — two labels and six dots overflow a
  375px frame that clips rather than scrolls, so the split is explicit, not `flex-wrap`. The strip takes no pointer
  events or it eats presses along the foot of the frame.
- **Slide photographs are imported — never `existsSync` against `public/`.** That check runs wherever the page
  renders, so on a host with no real filesystem it answers false for a file that is deployed and serving, and the
  slide ships blank. `SHELVES` pairs shelf to an imported image, so a missing file is a build error.
  `trust-band.tsx` carries the same rule.
- **Every shot must be composed like the flat-lay** — subject in the right-hand two thirds, bare wood left,
  because the copy column sits in its left 43%. **Slides carry photographs and copy, never products**: four
  best-seller tiles used to sit beside the copy, repeating the grids below; do not bring them back.
- **21:9 from `lg` up, content-driven below** — 21:9 on a phone is a 160px letterbox, so the shot becomes a band
  across the foot with copy above. One `Image` carries both compositions, so the hero preloads one file. Body copy
  runs `font-medium` and plum, because wood grain eats 400-weight type.
- **Each slide owns its background; there is no cross-fade** — slides translate on one flex track. `h-full` down
  the outer track, panels and inner tracks hands the frame's 21:9 height to the slides; it is shortest between `lg`
  and `xl`, which is why the equipment glyph plate shrinks in exactly that range.

## Starter kits

`/starters` and the home band under the hero. `lib/starters.ts` composes each kit **by rule, not by slug**: a kit is
a list of roles ("a magnesium glycinate under ฿600"), each filled with the best-selling in-stock match, so a
catalogue refresh re-resolves the kits instead of pointing at a dead product. An unfillable role is dropped; a kit
under two items is not published.

Audience is 16 and up, and the guardrails are code:

- `EXCLUDED` keeps children's lines and the whole `kids` category out of every kit. Most gummies in stock are
  children's lines, which is why no kit leads on format. Melatonin is excluded too, while staying on the sleep shelf
  with its guide — see `#what-we-wont-do` on `/starters`.
- Value is real numbers only: sum of item prices, a markdown only when every item has a `listPrice`, days supply
  from `servings`. No bundle discount is implied because there isn't one.
- No claim copy. `starters-check.mjs` sweeps both surfaces for weight-loss, focus and exam-result phrasing, skipping
  `#what-we-wont-do` — the one block allowed to name those claims, because it refuses them.

## Guides

`/guides` and `/guides/[slug]` are the editorial side, the one part written rather than harvested. `lib/guides.ts`
holds all six articles as structured data, so there is no markdown renderer and nothing to sanitise. Reading time is
counted off those words at 220wpm, so the label cannot drift from the article.

The copy rules are the catalogue's rules applied to prose: reference intakes are quoted as population figures and
named as such, label arithmetic is checkable against the bottle in your hand, and no sentence needs a study the site
cannot show you. The COA guide and `/quality` both state that no laboratory stands behind the shop; the older "we
publish the certificate of analysis for every lot" copy is gone.

Photography is harvested: `reference/editorial/photos.mjs` pulls one CC0 / public-domain / CC BY photo per guide
from Openverse, downscales to 2000px through Next's own `sharp`, and writes the credit to
`lib/editorial.generated.json`. `guides-check.mjs` asserts a credit exists for every cover, because a missing one
puts a CC BY image out of licence. Covers are reviewed by eye then pinned by image id in `PICKS`.


## Catalogue data

`reference/iherb/` is a three-stage pipeline — `discover` (listing pages -> `urls.json`), `harvest` (product pages ->
`products/<pid>.json` plus `public/products/iherb/*.jpg`), `build` (-> `lib/catalog.generated.json`). **Read
`reference/iherb/README.md` before touching it**; the bot check dictates the whole design.

- **Real, from the source page**: everything on the `Product` type except the three cases below — title, brand,
  price, availability, volume, rating, review count, every label field, every copy block, and the supplement-facts
  table including %DV.
- **Computed from two real numbers**: discount percent. (`perServing` is still emitted but shown nowhere.)
- **Real, restated at today's rate**: the price the storefront shows. See Currency.
- **Ours**: the storefront's own handling standards and site disclaimer — the source's names the source and is
  deliberately not copied. `ratingBreakdown` used to be here and is gone.
- **A field the source does not state comes through as `null` or an empty array and its panel renders nothing.** Keep
  that rule when adding fields: it is what stops the page claiming a %DV or best-by date no label backs.
- Stage 3 does all interpretation, so changing how a field is read is a `build.mjs` edit plus a rerun, never a
  re-scrape. Stage 2 caches per product, so an interrupted run resumes.

## Currency

The catalogue stores what iHerb charged in THB on the harvest day, frozen at that day's rate. `lib/fx.ts` unfreezes
it: `adjust()` restates a price at today's rate and `lib/catalog.ts` applies it once in the mapper, so filter bands,
sorting, kit totals and the free-delivery threshold all see plain THB.

- **Two rates, and mixing them up costs a slice of margin.** `HARVEST_MARKET_RATE` is the *market* rate on the
  harvest date, deliberately not the rate iHerb charged. Stored price is `usd x iHerb's rate`, carrying their spread
  (the harvest implies 32.81/USD on a day the market closed at 32.735). The ratio of two market rates moves each
  price by exactly what the market moved and leaves that spread inside the figure; dividing by iHerb's 32.81 would
  shave it off every price, once, silently. On a re-harvest this constant wants **the market rate for the new
  harvest date**, not the rate the new prices imply.
- **Prices round up to the whole baht** (`Math.ceil` in `adjust`), so none moves by more than ฿1 and every one stays
  at or above what it converts to. `price()` prints two decimals. No charm pricing — ฿9 is a margin decision and
  does not belong inside a currency conversion.
- **The rate is a committed build input, not a runtime lookup**, because `lib/catalog.ts` is synchronous and imported
  by every page. `reference/fx.mjs` reads the ECB daily reference rate (falling back to `open.er-api.com`), refuses
  anything outside 25-45 as broken, and **writes only once the rate has moved more than 0.5%**.
  `.github/workflows/exchange-rate.yml` runs it on weekdays and commits when it wrote.

## Reference material and git

`reference/NOTES.md` — measured iHerb tokens, per-page anatomy, and what was deliberately not copied.
`reference/shots/` holds the source screenshots; `reference/capture.mjs` re-captures them.

This folder is its own repository, on `main`, pushed to `github.com/gregorton/nutriva`.
