@AGENTS.md

# CLAUDE.md

## What this project is

**Slim Wellness Asia** — a supplement storefront for the Thai market: English UI copy, ฿ THB pricing, delivery
from Bangkok. Catalogue is real product data harvested from `th.iherb.com`; page structure, design system and
components are ours. Name and logo are the client's.

Structure and navigation take after `th.iherb.com` (dense grids, utility strip, category nav, deal rail, trust
band). The visual identity deliberately does not — see Design system.

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
node reference/brand/icons.mjs     # re-derive lockup + icons from the square logo source
node reference/editorial/photos.mjs [--candidates <slug>]     # guide covers
node reference/shoot.mjs label     # screenshot dev server -> reference/preview/ (gitignored)
```

Assertion scripts — `playwright-core` against the browser in `~/AppData/Local/ms-playwright`; all need the dev
server up, all take `BASE_URL`. Run the one covering the surface you touched:

```bash
node reference/interact.mjs        # product cards: one link, hover-reveal add
node reference/pdp-check.mjs       # PDP layout, stepper, cart round-trip, colour rules
node reference/chrome-check.mjs    # pinned chrome, clearances, stars without a numeral
node reference/hero-check.mjs      # hero tabs, wrapping, dots, inert slides, locked tab
node reference/starters-check.mjs  # kit surfaces swept for claim copy
node reference/guides-check.mjs    # a credit exists for every cover
node reference/search-check.mjs    # prediction panel, keyboard, phone sheet, no-JS fallback
node reference/auth-check.mjs      # full auth round trip; WRITES to the DB — use a scratch project
node reference/admin-check.mjs     # /admin gate, counters, beacon; writes but restores every counter
```

## Architecture

Next.js 16.3 App Router, React 19, Tailwind v4, TypeScript. Two data sources, no other backend: the static
catalogue module, and PostgreSQL for what visitors write.

- `lib/catalog.ts` — the single data boundary over `catalog.generated.json` (`byCategory`, `bestSellers`,
  `deals`, `related`, `search`, `brandsIn`…). Label fields arrive structured; nothing parses values out of
  titles. Only computed values: discount percent and `perServing` (read by no surface).
- `lib/fx.ts` — the one place an exchange rate enters; `catalog.ts`'s mapper calls `adjust()` on every price.
- `lib/query.ts` — filter/sort state lives in the URL; `toggleHref`/`setHref` build the next URL, so filters are
  links, not form controls: shareable, back-navigable, work without JS.
- `lib/subcategories.ts` — label + match terms per category, behind the browse rail atop `/c/[slug]`. A tile
  shows only when stock matches it; a tile is the `refine` param as a link, and `inSubcategory` filters on the
  terms it counted.
- `components/cart/cart-context.tsx` — cart in `localStorage` via `useSyncExternalStore`, empty server snapshot.
  **Never `useState` + effect**: hydration mismatch, and trips `react-hooks/set-state-in-effect`.
- Routes: `/`, `/c/[slug]` (dynamic — searchParams), `/p/[slug]` (SSG, 470 paths), `/starters`, `/deals`,
  `/equipment`, `/search`, `/guides` + `/guides/[slug]` (SSG), `/signin`, `/signup`, `/account` +
  `/account/saved` + `/account/reviews` (dynamic — cookie), `/admin` + `/admin/accounts` + `/admin/reviews` +
  `/admin/products` + `/admin/search` (dynamic — cookie), `/api/session`, `/api/search/suggest`, `/api/track`,
  `not-found`.
- **`app/` is split in two: `(storefront)` and `admin`.** Root layout is the document only — html, body, Inter,
  organisation JSON-LD. `app/(storefront)/layout.tsx` renders `components/chrome/storefront-shell.tsx` (utility
  bar, pinned chrome, `main`, footer, cart drawer); `/admin` sits beside the group and wears none of it. Route
  groups do not appear in URLs, so all 470 product pages still prerender. `app/not-found.tsx` **cannot** live
  inside the group — it catches unmatched URLs site-wide — so it composes the same shell.
- `components/chrome/sticky-chrome.tsx` — pins masthead + category row; the utility strip above scrolls away for
  good. Pinned state is measured off layout (`getBoundingClientRect().top <= 0`) through `useSyncExternalStore`,
  never state from an effect, and published as `data-stuck` so children condense off
  `group-data-[stuck=true]/chrome:` (masthead 72px -> 58px, mobile search row folds away). Pinned height is the
  `--spacing-chrome` token (103px), read by the anchor `scroll-margin-top` rule and the buy box's sticky offset.
- **The anchor offset is `scroll-margin-top` on the targets, never `scroll-padding-top` on `html`** — scroll
  padding also applies to the caret reveal after each keystroke, and the search field sits inside sticky chrome,
  so that reveal can never be satisfied and the field walks the page to the top one letter at a time. **A
  focusable control must not carry that offset.** `search-check.mjs` asserts the page does not move; `chrome-check.mjs` that `#reviews` clears the chrome.
- **`components/chrome/site-header.tsx` carries a temporary preview notice** — small red Thai
  ("ยังไม่เสร็จ / พรีเวิว") beside the lockup. **Delete before launch.**
- Everything is a server component except the cart, category-nav panel, sort select, countdown, rail scroller,
  sticky chrome, PDP zoom, hero carousel, and the account/review/save islands.

## Search

Ranking in `lib/catalog.ts`, suggestion vocabulary in `lib/search-suggest.ts`, one client island in
`components/chrome/search-box.tsx`.

- **`search()` scores; it never substring-tests.** A term must **start a word** (`normalise` + `hasTermPrefix`) —
  that is what makes `vit d` work with no synonym table. Every term must match somewhere; best field per term
  scores title 10, brand 7, category 5, label fields 2, then +8 whole phrase in title, +6 title opens with it,
  +1 in stock, tie-break `sold30d` then `reviews`. **A term under three characters may only match title, brand
  or category.** Plain synchronous scan of 470 rows: no index, no cache.
- **Only suggest what the stock holds.** `lib/search-suggest.ts` builds its vocabulary from what the repo already
  declares (`CATEGORIES[].chips`, `groupLabels()`, `brandsIn`, `formsIn`), counts each entry against the page it
  links to and **drops it at zero**, so it cannot drift from the catalogue. `didYouMean` is a Levenshtein pass
  over that vocabulary, used **only when a query scored nothing** (one edit up to five characters, two above, a
  trailing plural folded so `probiotc` reaches *Probiotics*); `app/search/page.tsx` renders the same guess from
  the same module. `server-only` — it reads the 1.9MB generated catalogue.
- **`GET /api/search/suggest?q=` is the seam**, cached `public, max-age=300`, so panel and results page run **the
  same `search()`** and the catalogue stays out of the client bundle. **It must send `Netlify-Vary: query=q`** —
  Netlify's adapter keys caches on `__nextDataReq` and `_rsc` only, so the first query cached was served to every
  later one (invisible in `next dev`). Any cacheable handler reading a search param needs it.
- **One combobox, three placements**: anchored panel from `sm` up, phone search row, full-screen sheet below `sm`
  (a dropdown there fights the 103px chrome and the keyboard). Sheet state lives in the store module, not React
  context, because the placements sit in three parents, and **the sheet is mounted by the icon trigger, not the
  row**, which folds away when the chrome pins. Every section flattens into **one flat `rows` array**, so arrow
  keys, `aria-activedescendant`, Enter and the live count never learn how many sections exist. Focus stays in the
  input; sections are `role="group"`. **The closed panel is unmounted, never a transparent one left in flow** —
  the `hint.tsx` sideways-scroll bug, asserted at 375px. Each placement is a real GET `<form action="/search">`,
  so it works before hydration and with JS off.
- **Fetches are sequence-numbered, and in-flight deduplication must not come back** — joining an older request
  resolves with a stale answer. 120ms debounce, an `AbortController` per request, the query stored beside the
  sequence, a `Map` of query to response so backspacing is instant. Previous rows stay while the next request is
  in flight; the panel never flashes empty. Recent searches are `localStorage` through `useSyncExternalStore`.

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

- **One face, every job: Inter**, behind both `--font-sans` and `--font-display`; size, weight and tracking do
  the work, `tabular-nums` aligns figures. Inter carries no Thai — localisation needs a second face. **The one
  exception is `/admin`**, which loads JetBrains Mono behind `--font-term` on that route only.
- **The logo is the client's artwork: placed, not drawn.** `components/chrome/logo.tsx` sets one `Image`; every
  shipped asset derives from `public/logos/slim-wellness-asia-square.png` via `reference/brand/icons.mjs` — a
  transparent lockup for the page, plus `app/icon.png` / `app/apple-icon.png` on white (thin gold strokes vanish
  against a dark tab). The lockup is stacked, so size it **by height alone** (`h-[58px]`, `h-[44px]` condensed),
  never width. The 250px source is a raster; ask the client for the vector.
- Utilities: `shell` (page container), `facts` (12px tabular data type), `kicker` (uppercase eyebrow), `btn-cart`
  (gradient add-to-cart, every placement), `banner-plum` / `banner-clinic` (full-bleed ramps), `.rail` (snap
  scroller), `.reveal-add` (hover-reveal add-to-cart).
- **The signature device is the facts strip** — a back-of-bottle spec row on every card
  (`components/product/facts-strip.tsx`), opened out on the PDP into `pdp/at-a-glance.tsx` and
  `pdp/supplement-facts.tsx`. Keep the card version **one fixed-height line** so card CTAs align across a row.
- **Cost per serving is gone from the storefront — do not reintroduce it.** Computed, not stated by any label.
- **Ratings are stars everywhere** (`components/ui/stars.tsx`), filled by a clipped overlay so 4.8 shows a
  part-filled fifth star. **Cards carry no numeric average** — only the review count follows the stars.
- **Product cards are one link**: one absolutely-positioned anchor (`before:absolute before:inset-0` on the title
  link) covers the card — one tab stop, text stays selectable, no button nested in an anchor. Add to cart layers
  above at `z-20`, revealed on hover/focus (`.reveal-add`); devices without hover show it always.

## Product page anatomy

Three columns: media, summary (flag -> title -> brand -> rating -> stock and momentum -> pack size -> at a glance
-> one cross-sell -> rankings), sticky buy box. Below the fold the **Pairs well with** rail comes before the
descriptive section — alternatives before a wall of label copy.

- `pdp/product-gallery.tsx` — one view per published shot, max four, switched by radio inputs and the `.gallery`
  rules in `globals.css`: no client JS, keyboard-operable, survives reload.
- `pdp/zoom-shot.tsx` — lens over the region under the pointer plus a pane beside the frame at the source file's
  resolution (900px, ~2.3x). The pane is `position: fixed` to escape the frame's `overflow-hidden`, which holds
  only while no ancestor creates a containing block — **never put `transform`, `filter` or `will-change` back on
  the frame**. Inactive shots are `visibility: hidden`, so no active-index state is needed, and it **must stay a
  direct child of `.frame` in source order** (`:nth-child` rules). Off below 1024px and for touch pointers. **No
  product image anywhere carries a hover transform.**
- `pdp/product-information.tsx` — 14/10 split: Overview, Specifications, Suggested use, Other ingredients,
  Warnings, Storage, Disclaimer left, `supplement-facts.tsx` right. **New copy blocks go here**, never beside the
  buy box.
- `lib/product-info.ts` — selection and fallback for that copy, never invention: a derived-but-true line stands in
  where a product states no overview, directions or warnings; panels with no input render nothing.
- `pdp/buy-box.tsx` — price, markdown, free-delivery threshold, stepper with a per-order cap, full-width
  `btn-cart`. Subscription, BNPL and "see price in cart" are deliberately absent — nothing supports them.
- Reference green becomes `plum-700` here; the shared card keeps `pandan`, so rail cards are the one green left.
- **No fabricated testing claims** — the lot strip, per-lot buy-box copy and the invented "two-lab lot release"
  standard are gone; nothing behind the storefront runs a lab. Marks read off the label stay.
- The Reviews block is real, from PostgreSQL: two ratings side by side, **never averaged together**.
- `components/ui/hint.tsx` — info-mark popover, CSS only, no client JS.

## Accounts and reviews

PostgreSQL on Neon holds what the catalogue cannot — accounts, sessions, reviews, saved items. `DATABASE_URL` in
`.env.local` is the project's only secret; unset, `isConfigured()` in `lib/db.ts` switches the feature off rather
than erroring, so a build works with no database.

- `lib/db.ts` — one `pg` pool on `globalThis`, or `next dev` leaks a socket set per hot reload. TLS verified
  (localhost excepted). **Every statement is parameterised**; a placeholder used twice in one statement needs an
  explicit `::type` (see the lockout update in `lib/accounts.ts`).
- `lib/schema/*.sql` + `reference/db/migrate.mjs` — numbered migrations, one transaction each, recorded in
  `schema_migrations` so re-running is a no-op. `seed.mjs` picks products off the real catalogue.
- `lib/password.ts` — scrypt from `node:crypto`, stored `scrypt$N$r$p$salt$hash` so cost can be raised without
  invalidating anyone. No `server-only` import: `seed.mjs` imports it too.
- `lib/session.ts` — cookie carries 32 random bytes, the table stores only their SHA-256, so a dumped row cannot
  be replayed. `secure` is production-only or the cookie never sets over localhost.
- `lib/dal.ts` — `getUser()` (React `cache`d, two-field DTO, never the row) and `requireUser()`; everything
  touching per-user data goes through here, not the cookie. Its catch calls `unstable_rethrow` **first** — a
  prerender cookie read throws a framework signal meaning "render at request time", and swallowing it renders the
  page as though nobody were signed in.
- **Nothing under `/account` sets `force-dynamic`** — the cookie read already makes it dynamic, and forcing it
  stops `refresh()` from an action updating the page in place. `proxy.ts` (Next 16's renamed middleware) only
  checks that a cookie exists.
- `lib/accounts.ts`, `lib/reviews.ts`, `lib/saved.ts` query; `app/actions/*.ts` mutate, and **every action
  re-verifies the session**: a Server Action is a POST endpoint anything can call.

**Keeping the site static shaped all of it** — the masthead is in `app/(storefront)/layout.tsx`, so awaiting
`cookies()` there would turn every storefront route dynamic and cost all 470 product pages their prerender.
Consequences, none optional:

- `components/account/account-store.ts` — the cart's contract applied to the session: `useSyncExternalStore`,
  empty server snapshot, filled from `GET /api/session` after mount. `account-button.tsx`, `review-form.tsx` and
  `product/save-button.tsx` read it and render signed-out until it says otherwise. **None is a permission check.**
- `components/account/session-sync.tsx` re-reads the session on pathname change, because signing in navigates
  before client code gets a say. Refreshes are **sequence-numbered**; **do not reintroduce in-flight
  deduplication**, which let a stale reply overwrite a newer one.
- `/p/[slug]` reads reviews through `unstable_cache` tagged `reviews:<slug>`, so anonymous traffic gets built HTML
  and never reaches Postgres. Posting calls **`updateTag()`, not `revalidateTag()`** (which serves the writer the
  stale copy their own review is missing from), then `refresh()` from `next/cache`.
- Auth actions **do not `redirect()`**: they return where to go and the form navigates, fields held in state so a
  rejected password does not empty the form. Without JS the account is still created.
- Review paging is a server function with a cursor (`pdp/review-more.tsx`), not `?page=` — reading `searchParams`
  would make all 470 pages request-time. Keyset on `(created_at, id)`.

**One flow, two steps.** `/signin` and `/signup` are the same two screens on two paths (`account/auth-flow.tsx`
picks, `auth-steps.tsx` holds step two): an address, then a password if it has an account, or a name and new
password if not.

- **The step is in the URL, not state** — Continue is a plain GET form landing on `?email=…`, looked up on the
  server: step one needs no JS, Back/Change are ordinary links, a reload stays put.
- **`accountExists()` is a deliberate hole in that file's rule 2** — two different second screens confirm whether
  an address is registered however they are worded. The lockout is untouched.
- The strength meter scores four rules but **gates on only the two `checkRegistration` enforces** (eight
  characters, a letter, a number), so it never blocks a password the server would take.
- **Your name** is the one field the reference flow lacks: reviews are attributed by display name, and there is no
  settings page to change it later.
- Providers appear on step one only, where "sign in" and "create an account" are the same press — hence
  `OAuthButtons` carries one label, not a mode.

**The honesty rule.** `product.rating`/`product.reviews` are the source listing's aggregate; reviews written here
are ours. Two labelled figures, **never averaged into one**. `ratingBreakdown()`, which fitted a curve to the
source average to draw per-star bars, is **deleted**: bars count real rows. "Verified purchases only" is gone too
— there is no checkout, so nothing can be verified.

**Google / Facebook sign-in replaces none of it**: a provider is another way to reach `startSession()`; `users`,
sessions and the DAL are untouched. `lib/oauth.ts` describes one authorization-code flow as data, an entry per
provider; `/api/auth/[provider]` starts it, `.../callback` finishes it. No client JS.

- **A provider whose credentials are unset does not appear** (`configuredProviders()` reads the env).
- `state` is random, in a short-lived httpOnly cookie, compared constant-time on return. PKCE keeps the verifier
  there and sends only its SHA-256 (Google requires it; Facebook takes it inconsistently, so it is a per-provider
  flag, off there). The code is exchanged server-to-server with the client secret, identity comes from the
  provider's own endpoint, and **nothing in the query string is treated as who somebody is**. `?next=` goes
  through the sign-in form's local-path check.
- **Accounts link on a verified email and nothing else.** `linkOrCreateAccount` tries the `identities` row, then a
  *verified* address matching an existing account, then creates one. An unverified match is **refused outright** —
  otherwise somebody registers your address at a provider that does not check it and walks into your account. A
  Facebook account with no email gets one here with none: `users.email` and `users.password_hash` are both
  nullable, and `authenticate()` refuses a row without a password.
- The cookie is `SameSite=Lax`, not Strict: the provider returns people with a top-level GET that Strict would not
  attach it to, leaving the callback nothing to check `state` against.
- Failures return `/signin?error=<reason>`; the page turns each reason into something readable.

Two `auth-check.mjs` traps: `page.textContent('body')` also reads the RSC flight data Next embeds in `<script>`
tags, so "is it gone" is a false pass — use `innerText`; and navigation waits on `domcontentloaded`, not
`networkidle`, because the footer links to six routes that do not exist (`/help/delivery`, `/help/returns`,
`/help/contact`, `/account/orders`, `/quality`, `/sourcing`) and their prefetches never settle.

## Internal dashboard

`/admin` — a private, read-only survey for a named few: overview, accounts, reviews, products, search.

- **The gate is `lib/admin.ts`, an env allowlist.** `ADMIN_EMAILS`, comma-separated, checked after the ordinary
  sign-in. Unset means nobody and `/admin` 404s for everyone — no default administrator, and revoking is an env
  edit. `requireAdmin()` sends a stranger to `/signin` and answers a signed-in non-admin with **`notFound()`, not
  403**. Every page calls it for itself; the layout's call is for the bar and the tabs.
- **Nothing on this site verifies an email address** — it sends no mail at all — so whoever registers an
  allowlisted address first gets in. **Create the accounts, then add the addresses.**
- `isAdmin()` lets only a boolean out, holding `lib/dal.ts`'s rule that no email reaches a component.
  `/admin/accounts` is the one surface that displays an address.
- **Read-only by construction** — no action, no form, no mutation, so a leaked admin session cannot damage.
  `proxy.ts` matches `/admin` too, but only for the cookie-presence check: it is not the gate.
- `/admin` sits **outside** `(storefront)`, so the only layout above it is the document — no utility bar, masthead,
  category nav, footer or cart drawer; a title bar, shell prompt, lowercase tabs and a status line stand in, and
  the two links in that title bar are the only way back out. **Nothing here uses the brand palette** except `turmeric-500`, `sold` and
  `star`, and **JetBrains Mono is loaded in `app/admin/layout.tsx`, not the root layout**, binding
  `--font-jetbrains` which `@theme` reads through `--font-term` — a separate token, so the storefront keeps Inter.
- Charts are hand-rolled inline SVG (`components/admin/bar-chart.tsx`) stretched with
  `preserveAspectRatio="none"`, so every bar must stay a plain rect — corners, strokes and text distort with it.
  No charting library; the project runs on five dependencies.

**The counters** are `lib/schema/003_analytics.sql`, written by `lib/analytics.ts` and read by `lib/admin-stats.ts`:
`product_views`, `page_views`, `search_queries`, each a `(thing, day)` primary key over an integer bumped by one
upsert. No visitor id, no cookie, no IP, no per-event row — they answer "how many", never "who", by design.

- **`day` is Bangkok's, never `current_date`** — the Neon branch runs in GMT, so the two disagree for the first
  seven hours of every Thai day and the evening peak files under yesterday. The zone is a parameter,
  `(now() at time zone $n::text)::date`, so it lives in one constant.
- **`POST /api/track` is the only writer, and every key is validated against something the server already knows**:
  a slug through `getProduct()`, a surface against a fixed set, the result count from `search()` — **never from the
  request body**. It answers 204 to everything. No CSRF token, deliberately: a forged call can only nudge an
  anonymous counter.
- **Anyone on the allowlist is excluded from every counter** — `/api/track` calls `isAdmin()` and drops the write,
  so the people who open every page while building the shop cannot inflate the figures they read. Hence the
  beacon's fetch must keep its default `credentials: "same-origin"`. Anonymous traffic costs nothing:
  `readSession()` returns null without a query.
- **`components/analytics/view-beacon.tsx` is a client island because the counted pages must stay prerendered** — a
  server-side insert in `/p/[slug]` would break the prerender or never run again. A module-level `Set` dedupes per
  JS context, and there is deliberately **no `AbortController`**: unmount is the navigation being recorded. A view
  is a product opened by a browsing context — not a hit and not a person.
- **Search is counted on a submitted `/search` only** — `/api/search/suggest` is CDN-cached, and a cached response
  never reaches the origin, so keystrokes cannot be logged even in principle. **The queries that returned nothing
  are the point of the page.**
- Averages on `/admin/products` count **our** reviews only. `sold30d` appears nowhere: it describes trade at the
  source, not here.
- `node reference/admin-check.mjs` **puts every counter it touches back**, so unlike `auth-check.mjs` it is safe
  against the real project. Its dashboard half needs `ADMIN_EMAILS=admin-check@slimwellness.test` or it SKIPs.

## Home hero

`components/home/hero-carousel.tsx` — the only client component above the fold — holds two tabs, each with its own
slideshow. `home-hero.tsx` is the server half and the only one that imports `lib/catalog.ts`; importing it
client-side would ship the whole generated catalogue. They meet at the types in `hero-slides.ts`.

- **The pill switches topic, the arrows move within it.** Supplements runs the shelves (opening slide, then
  Vitamins, Minerals, Immunity, Omega, Herbs — heading, blurb and in-stock count off `CATEGORIES`); Medical
  equipment runs four ranges from `equipment-glyphs.tsx` as line art — name, short spec, no prices, no catalogue
  behind it.
- **No arrow crosses to the other topic, and the slideshow wraps both directions**, so no button is ever disabled —
  one that disables itself as it fires hands keyboard focus back to the document.
- **It rotates on its own** (`ROTATE_MS`, 6.5s) through the same wrap as the right arrow, `held` while the pointer
  is over the banner or focus is inside it, never started under `prefers-reduced-motion`. There is **no pause
  control** — hovering is the only stop, the one place the hero misses WCAG 2.2.2. The timer is keyed on the
  position, so an arrow or dot press restarts the clock.
- **Medical equipment is locked** by `locked` on its `TABS` entry; the tab still shows, because that shelf is
  coming. `aria-disabled` with a no-op press, **not** `disabled` — that gets no pointer events, losing the
  `not-allowed` cursor and hover title that say why. Unlocking is deleting the flag.
- **Two nested tracks, not one flat track** — flat, a tab switch animates through intervening slides. **Each tab
  keeps its own position**; every slide stays mounted for a stable height and carries **`inert` unless on screen**,
  or an off-screen CTA is a tab stop for a slide nobody can see. On a phone the tab label shortens to
  "Equipment", but the `aria-label` stays the full name.
- **The control cluster is one pill from `sm` up and two stacked rows below** — two labels and six dots overflow a
  375px frame that clips rather than scrolls. The split is explicit, not `flex-wrap`. The strip takes no pointer
  events or it eats presses along the foot of the frame; the cluster is left-aligned with the copy, and the dot row
  carries `aria-current`.
- **Slide photographs are imported — never `existsSync` against `public/`.** That check runs wherever the page
  renders, so on a host with no real filesystem it answers false for a file that is deployed and serving, and the
  slide ships blank. `SHELVES` pairs shelf to an imported image, so a missing file is a build error and the URL is
  a hashed immutable asset. `trust-band.tsx` carries the same rule. Nothing hardcodes the count.
- **Every shot must be composed like the flat-lay** — subject in the right-hand two thirds, bare wood left,
  because the copy column sits in its left 43%.
- **Supplements slides are photographs with copy on them and carry no products.** Four best-seller tiles used to
  sit beside the copy, repeating the grids below the banner; do not bring them back.
- **21:9 from `lg` up, content-driven below** — 21:9 on a phone is a 160px letterbox, so the shot becomes a band
  across the foot with copy above, sized by percentage. One `Image` carries both compositions, so the hero preloads
  one file; `object-position` is biased down and right.
- **Body copy on a supplements slide runs a step heavier** — `font-medium` and plum, because wood grain eats
  400-weight type. Its button is the ordinary primary button, not `btn-cart`.
- **Each slide owns its background; there is no cross-fade** — slides translate on one flex track and the equipment
  slide carries `banner-clinic` itself. `h-full` down the outer track, panels and inner tracks hands the frame's
  21:9 height to the slides; it is shortest between `lg` and `xl`, which is why the equipment glyph plate shrinks
  in exactly that range. The frame carries a hairline `ring-line`.

## Starter kits

`/starters` and the home band under the hero. `lib/starters.ts` composes each kit **by rule, not by slug**: a kit is
a list of roles ("a magnesium glycinate under ฿600"), each filled with the best-selling in-stock match, so a
catalogue refresh re-resolves the kits instead of pointing at a dead product. An unfillable role is dropped; a kit
under two items is not published.

Audience is 16 and up, and the guardrails are code:

- `EXCLUDED` keeps children's lines and the whole `kids` category out of every kit. Most gummies in stock are
  children's lines, which is why no kit leads on format.
- Melatonin is excluded from every kit, deliberately, while staying on the sleep shelf with its guide — see
  `#what-we-wont-do` on `/starters`.
- Value is real numbers only: sum of item prices, a markdown only when every item has a `listPrice`, days supply
  from `servings`. No bundle discount is implied because there isn't one.
- No claim copy. `starters-check.mjs` sweeps both surfaces for weight-loss, focus and exam-result phrasing, skipping
  `#what-we-wont-do` — the one block allowed to name those claims, because it refuses them.
- `components/starters/add-kit.tsx` adds every item in one press; the cart's `add` composes in a loop because each
  call reads and writes the same external snapshot.

## Guides

`/guides` and `/guides/[slug]` are the editorial side, the one part written rather than harvested. `lib/guides.ts`
holds all six articles as structured data, so there is no markdown renderer and nothing to sanitise. Reading time is
counted off those words at 220wpm, so the label cannot drift from the article.

The copy rules are the catalogue's rules applied to prose: reference intakes are quoted as population figures and
named as such, label arithmetic (IU/mcg, elemental versus compound weight, EPA+DHA per softgel) is checkable against
the bottle in your hand, and no sentence needs a study the site cannot show you. The COA guide states plainly that
Slim Wellness Asia runs no laboratory. **The footer and utility strip still carry older "we publish the certificate
of analysis for every lot" copy, which contradicts that — worth reconciling.**

Photography is harvested: `reference/editorial/photos.mjs` pulls one CC0 / public-domain / CC BY photo per guide
from Openverse, downscales to 2000px through Next's own `sharp`, and writes the credit to
`lib/editorial.generated.json`. `guides-check.mjs` asserts a credit exists for every cover, because a missing one
puts a CC BY image out of licence. Modern stock sources are tried before Flickr and Wikimedia, museum archives never;
covers are reviewed by eye then pinned by image id in `PICKS`.

Card sizes in `components/guides/guide-card.tsx`: `GuideFeature` (16:9 lead), `GuideCard` (3:2 grid), `GuideRow`
(thumbnail beside the headline).

## Catalogue data

`reference/iherb/` is a three-stage pipeline — `discover` (listing pages -> `urls.json`), `harvest` (product pages ->
`products/<pid>.json` plus `public/products/iherb/*.jpg`), `build` (-> `lib/catalog.generated.json`). **Read
`reference/iherb/README.md` before touching it**; the bot check dictates the whole design.

- **Real, from the source page**: title, brand, THB price, availability, 30-day volume, rating and review count,
  product code, UPC, package quantity, serving size, servings per container, best-by, first available, shipping
  weight, dimensions, certification and quality marks, highlight bullets, overview copy, suggested use, other
  ingredients, warnings, storage, and the supplement-facts table including %DV.
- **Computed from two real numbers**: discount percent. (`perServing` is still emitted but shown nowhere.)
- **Real, restated at today's rate**: the price the storefront shows. See Currency.
- **Ours**: the storefront's own handling standards and site disclaimer — the source's own disclaimer names the
  source and is deliberately not copied. `ratingBreakdown` used to be here and is gone.
- **A field the source does not state comes through as `null` or an empty array and its panel renders nothing.**
  Keep that rule when adding fields: it is what stops the page claiming a %DV or best-by date no label backs.
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
  at or above what it converts to. `price()` prints two decimals (`฿357.00`). No charm pricing, nothing nudged to
  ฿599 — ฿9 is a margin decision and does not belong inside a currency conversion.
- **The rate is a committed build input, not a runtime lookup**, because `lib/catalog.ts` is synchronous and imported
  by every page. `reference/fx.mjs` reads the ECB daily reference rate (falling back to `open.er-api.com`), refuses
  anything outside 25-45 as broken, and **writes only once the rate has moved more than 0.5%**.
  `.github/workflows/exchange-rate.yml` runs it on weekdays just after the ECB publishes and commits when it wrote,
  landing on `main` for Netlify's git deploy.

## Reference material

`reference/NOTES.md` — measured iHerb tokens, per-page anatomy, and what was deliberately not copied (three stacked
interruptions, six-element product cards, promo-led hero). `reference/shots/` holds the source screenshots;
`reference/capture.mjs` re-captures them.

## Git

This folder is its own repository, on `main`, pushed to `github.com/gregorton/nutriva`.
