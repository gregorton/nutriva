@AGENTS.md

# CLAUDE.md

## What this project is

**Slim Wellness Asia** — a supplement storefront for the Thai market: English UI copy, ฿ THB pricing,
delivery from Bangkok. Catalogue is real product data harvested from `th.iherb.com`; page structure,
design system and components are ours. Name and logo are the client's.

Structure and navigation take after `th.iherb.com` (dense grids, utility strip, category nav, deal rail,
trust band). The visual identity deliberately does not — see Design system.

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

Assertion scripts — all drive `playwright-core` (devDependency) against the browser under
`~/AppData/Local/ms-playwright`, all need the dev server up, all take `BASE_URL` for a non-3000 port.
Run the relevant one after touching its surface:

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
  `deals`, `related`, `search`, `brandsIn`…). Label fields arrive structured; nothing here parses values out
  of titles. Only computed values: discount percent and `perServing` (read by no surface).
- `lib/fx.ts` — the one place an exchange rate enters; `catalog.ts`'s mapper calls `adjust()` on every price.
- `lib/query.ts` — filter/sort state lives in the URL; `toggleHref`/`setHref` build the next URL, so filters
  are links, not form controls: shareable, back-navigable, work without JS.
- `lib/subcategories.ts` — label + match terms per category behind the browse rail at the head of `/c/[slug]`.
  A tile only shows when the stock matches it, so the rail describes the catalogue rather than a taxonomy; a
  tile is the `refine` URL param as a link, and `inSubcategory` filters on the terms the tile counted.
- `components/cart/cart-context.tsx` — cart in `localStorage` via `useSyncExternalStore` with an empty server
  snapshot. **Never `useState` + effect**: hydration mismatch, and trips `react-hooks/set-state-in-effect`.
- Routes: `/`, `/c/[slug]` (dynamic — searchParams), `/p/[slug]` (SSG, 470 paths), `/starters`, `/deals`,
  `/equipment`, `/search`, `/guides` + `/guides/[slug]` (SSG), `/signin`, `/signup`, `/account` +
  `/account/saved` + `/account/reviews` (dynamic — session cookie), `/admin` + `/admin/accounts` +
  `/admin/reviews` + `/admin/products` + `/admin/search` (dynamic — session cookie), `/api/session`,
  `/api/search/suggest`, `/api/track`, `not-found`.
- **`app/` is split in two: `(storefront)` and `admin`.** The root layout is the document only — html,
  body, Inter, the organisation JSON-LD. `app/(storefront)/layout.tsx` renders
  `components/chrome/storefront-shell.tsx` (utility bar, pinned chrome, `main`, footer, cart drawer) and wraps
  every shop route; `/admin` sits beside the group and wears none of it. Route groups do not appear in URLs, so
  no path changed and all 470 product pages still prerender. `app/not-found.tsx` **cannot** live inside the
  group — it catches unmatched URLs site-wide — so it composes the same shell rather than a second copy of the
  chrome, which is what keeps a mistyped URL looking like the shop.
- `components/chrome/sticky-chrome.tsx` — pins masthead + category row; the utility strip above scrolls away
  for good. Pinned state is measured off layout (`getBoundingClientRect().top <= 0`) through
  `useSyncExternalStore`, not state from an effect, and published as `data-stuck` so children condense off
  `group-data-[stuck=true]/chrome:` (masthead 72px -> 58px, mobile search row folds away). Pinned height is
  the `--spacing-chrome` token (103px), read by the anchor-target `scroll-margin-top` rule and the PDP buy
  box's sticky offset — changing chrome height is a one-line edit.
- **That anchor offset is `scroll-margin-top` on the targets, never `scroll-padding-top` on `html`.** Scroll
  padding applies to every reveal the browser performs on the scroll container, including the one after each
  keystroke that keeps the caret visible — and the search field is inside sticky chrome, so that reveal can
  never be satisfied: scrolling up moves the page without moving the field, and the deficit is identical on
  the next letter. The field walked the page back to the top one letter at a time, and focusing or tabbing
  into the chrome jumped the same way. `search-check.mjs` asserts the page does not move; `chrome-check.mjs`
  still measures that `#reviews` clears the chrome. A focusable control must not carry that offset.
- **`components/chrome/site-header.tsx` carries a temporary preview notice** — small red Thai
  ("ยังไม่เสร็จ / พรีเวิว") beside the lockup. **Delete before launch**; the only masthead element not meant
  to ship.
- Everything is a server component except the cart, category-nav panel, sort select, countdown, rail
  scroller, sticky chrome, PDP zoom, hero carousel, and the account/review/save islands.

## Search

Three parts: the ranking in `lib/catalog.ts`, the suggestion vocabulary in `lib/search-suggest.ts`, and one
client island in `components/chrome/search-box.tsx`.

- **`search()` scores; it does not test for substrings.** It used to split the query and ask
  `haystack.includes(term)`, then sort the survivors by 30-day volume alone — so `vitamin d` returned 172
  products with a marine collagen second (the `d` in *Hydrolyzed*), and where a term matched never affected
  the order. A term now has to **start a word** (`normalise` + `hasTermPrefix`), which is also what makes
  `vit d` work with no synonym table. Every term must still match somewhere, and the best field per term
  scores: title 10, brand 7, category 5, label fields (form, dose, pack quantity, highlights) 2; then +8 for
  the whole phrase in the title, +6 if the title opens with it, +1 in stock, tie-broken on `sold30d` then
  `reviews`. **A term under three characters may only match title, brand or category** — a stray `d` in a
  highlight bullet is noise. `vitamin d` is now 73 results led by three D3 products. Still a plain
  synchronous scan of 470 rows: no index, no cache.
- **Only suggest what the stock holds.** `lib/search-suggest.ts` assembles its vocabulary out of things the
  repo already declares — `CATEGORIES[].chips`, the browse rail's `groupLabels()`, `brandsIn`, `formsIn` —
  counts every entry against the page it links to and **drops it at zero**, the rule `lib/subcategories.ts`
  applies to its tiles. There is no hand-written keyword list, so the vocabulary cannot drift from the
  catalogue. `didYouMean` is a Levenshtein pass over it, consulted **only when a query scored nothing** (one
  edit up to five characters, two above, one trailing plural folded so `probiotc` reaches *Probiotics*), and
  `app/search/page.tsx` renders the same guess from the same module — a panel and a results page can never
  name different words for one typo. `server-only`: it reads the 1.9MB generated catalogue.
- **`GET /api/search/suggest?q=` is the seam**, cached `public, max-age=300` — nothing per-visitor here,
  unlike `/api/session`. Fetching rather than shipping an index keeps the catalogue out of the client bundle
  and means the panel and the results page run **the same `search()`**, so the rows previewed are the rows
  delivered. `max-age` is the **browser's** cache: a Worker's response is not held at the edge unless a
  Cache Rule or the Cache API puts it there, so on Cloudflare a keystroke that misses the panel's own
  `Map` reaches the handler — affordable, since `suggest()` is a synchronous scan of 470 rows with no
  database behind it. **If an edge cache is ever put in front of it, check `q` is in the key.** On
  Netlify it was not: that adapter keyed its caches on `__nextDataReq` and `_rsc` only, so a `public`
  response was stored under a key ignoring `q` — the first query cached was served to every later one and
  the live field predicted nothing, while `next dev`, with no CDN in front of it, behaved perfectly. It
  took a `Netlify-Vary: query=q` header to undo, and no local run can show the bug.
- **One combobox, three placements.** An anchored panel from `sm` up, the phone search row, and a
  full-screen sheet below `sm` — a dropdown there would fight the 103px pinned chrome and the on-screen
  keyboard. Sheet state lives in the store module rather than React context, because the three placements sit
  in three different parents, and **the sheet is mounted by the icon trigger, not the row**, which folds away
  when the chrome pins. Every section flattens into **one flat `rows` array**, so arrow keys,
  `aria-activedescendant`, Enter and the live count never learn how many sections exist — adding a section is
  a data change. DOM focus stays in the input; sections are `role="group"` so the listbox's children stay
  options and groups. **The closed panel is unmounted, never a transparent one left in flow** — that is the
  `components/ui/hint.tsx` sideways-scroll bug, which `search-check.mjs` asserts against at 375px. Each
  placement is a real GET `<form action="/search">`, so the field works before hydration and with JS off, and
  the phone icon stays a real link to `/search`.
- **Fetches are sequence-numbered, and in-flight deduplication must not come back** — the rule
  `session-sync.tsx` already carries, for the same reason: joining an older request resolves with a stale
  answer. 120ms debounce, an `AbortController` per request, the query stored beside the sequence so a reply
  the input no longer wants is dropped, and a `Map` of query to response so backspacing is instant. Previous
  rows stay on screen while the next request is in flight; the panel never flashes empty. Recent searches are
  `localStorage` read through `useSyncExternalStore` with an empty server snapshot, the cart's contract.

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
  the work, `tabular-nums` aligns figures in grid columns. Inter carries no Thai — localisation needs a second
  face. **The one exception is `/admin`**, which loads JetBrains Mono behind `--font-term`, on that route only:
  a console that is not monospaced is not a console.
- **The logo is the client's artwork: placed, not drawn.** `components/chrome/logo.tsx` sets one `Image`.
  Every shipped asset derives from `public/logos/slim-wellness-asia-square.png` via
  `reference/brand/icons.mjs` — a transparent lockup for the page, plus `app/icon.png` / `app/apple-icon.png`
  on white, because thin gold strokes vanish against a dark tab. The lockup is stacked, so size it **by height
  alone** (`h-[58px]`, `h-[44px]` condensed), never width — the intrinsic 185:146 stops it stretching. The
  250px source is a raster; ask the client for the vector before scaling up.
- Utilities: `shell` (page container), `facts` (12px tabular data type), `kicker` (uppercase eyebrow),
  `btn-cart` (gradient add-to-cart, every placement), `banner-plum` / `banner-clinic` (full-bleed ramps),
  `.rail` (snap scroller), `.reveal-add` (hover-reveal add-to-cart).
- **The signature device is the facts strip** — a back-of-bottle spec row on every card
  (`components/product/facts-strip.tsx`), opened out on the PDP into `pdp/at-a-glance.tsx` and
  `pdp/supplement-facts.tsx`. It carries pack size: the figure shoppers compare on and a photo cannot show.
  Keep the card version **one fixed-height line** so card CTAs align across a grid row.
- **Cost per serving is gone from the storefront — do not reintroduce it.** It was computed, not stated by any
  label.
- **Ratings are stars everywhere** (`components/ui/stars.tsx`), filled by a clipped overlay so 4.8 shows a
  part-filled fifth star. **Cards carry no numeric average** — only the review count follows the stars; the
  exact average stays on the PDP.
- **Product cards are one link**: a single absolutely-positioned anchor (`before:absolute before:inset-0` on
  the title link) covers the card — one tab stop, text stays selectable, no button nested in an anchor. Add to
  cart layers above at `z-20`, revealed on hover/focus (`.reveal-add`); devices without hover show it always.

## Product page anatomy

Three columns: media, summary (flag -> title -> brand -> rating -> stock and momentum -> pack size -> at a
glance -> one cross-sell -> rankings), sticky buy box. Below the fold the **Pairs well with** rail comes
before the descriptive section — alternatives before a wall of label copy.

- `pdp/product-gallery.tsx` — one view per published shot, max four, switched by radio inputs and the
  `.gallery` rules in `globals.css`: no client JS, keyboard-operable, survives reload.
- `pdp/zoom-shot.tsx` — lens over the region under the pointer plus a pane beside the frame at the source
  file's resolution (900px, ~2.3x). The pane is `position: fixed` to escape the frame's `overflow-hidden`,
  which holds only while no ancestor creates a containing block — **never put `transform`, `filter` or
  `will-change` back on the frame**. Inactive shots are `visibility: hidden`, so no active-index state is
  needed, and it **must stay a direct child of `.frame` in source order** (those rules use `:nth-child`). Off
  below 1024px and for touch pointers. **No product image anywhere carries a hover transform.**
- `pdp/product-information.tsx` — 14/10 split: Overview, Specifications, Suggested use, Other ingredients,
  Warnings, Storage, Disclaimer left, `supplement-facts.tsx` right. Nothing descriptive belongs beside the buy
  box; **new copy blocks go here**.
- `lib/product-info.ts` — selection and fallback for that copy, never invention: a derived-but-true line
  stands in where a product states no overview, directions or warnings; panels with no input render nothing.
- `pdp/buy-box.tsx` — price, markdown, free-delivery threshold, stepper with a per-order cap, full-width
  `btn-cart`. Subscription, BNPL and "see price in cart" are deliberately absent — nothing supports them.
- Reference green becomes `plum-700` here; the shared card keeps `pandan`, so rail cards are the one green left.
- **No fabricated testing claims** — the lot strip, per-lot buy-box copy and the invented "two-lab lot release"
  standard are gone; nothing behind the storefront runs a lab. Marks read off the label stay.
- The Reviews block is real, from PostgreSQL: two ratings side by side, **never averaged together**.
- `components/ui/hint.tsx` — info-mark popover, CSS only, no client JS.

## Accounts and reviews

PostgreSQL on Neon holds what the catalogue cannot — accounts, sessions, reviews, saved items.
`DATABASE_URL` in `.env.local` is the project's only secret; with it unset `isConfigured()` in `lib/db.ts`
switches the feature off rather than erroring, which keeps a build working with no database.

- `lib/db.ts` — one `pg` pool parked on `globalThis` so `next dev` does not leak a socket set per hot reload.
  TLS verified (localhost excepted). **Every statement is parameterised** — nothing here interpolates a value
  into SQL. A placeholder used twice in one statement needs an explicit `::type` or Postgres refuses to deduce
  one; see the lockout update in `lib/accounts.ts`.
- `lib/schema/*.sql` + `reference/db/migrate.mjs` — numbered migrations, one transaction each, recorded in
  `schema_migrations` so re-running is a no-op. `seed.mjs` picks products off the real catalogue.
- `lib/password.ts` — scrypt from `node:crypto`, stored `scrypt$N$r$p$salt$hash` so cost can be raised without
  invalidating anyone. No `server-only` import, because `seed.mjs` imports it too.
- `lib/session.ts` — cookie carries 32 random bytes, the table stores only their SHA-256, so a dumped row
  cannot be replayed. `secure` is production-only or the cookie never sets over localhost.
- `lib/dal.ts` — `getUser()` (React `cache`d, two-field DTO, never the row) and `requireUser()`. Everything
  touching per-user data goes through here rather than reading the cookie. Its catch calls `unstable_rethrow`
  **first**: reading cookies during a prerender throws a framework signal meaning "render at request time",
  and swallowing it renders the page as though nobody were signed in.
- **Nothing under `/account` sets `force-dynamic`** — the cookie read already makes it dynamic, and forcing it
  stops `refresh()` from an action updating the page in place. **There is no proxy — Next 16's renamed
  middleware — and adding one back is expensive**: it checked only whether a session cookie existed, which
  `requireUser()` and `requireAdmin()` both do anyway with the same `?next=` redirect, and it cost 0.6MB
  gzipped of a 3MiB Worker to do it. What it saved was a render on a signed-out prefetch. See Deployment.
- `lib/accounts.ts`, `lib/reviews.ts`, `lib/saved.ts` are the query modules; `app/actions/*.ts` the mutations,
  and **every one re-verifies the session**: a Server Action is a POST endpoint anything can call.

**Keeping the site static shaped all of it** — the masthead is in `app/(storefront)/layout.tsx`, so awaiting
`cookies()` there would turn every storefront route dynamic and cost all 470 product pages their prerender.
Consequences, none optional:

- `components/account/account-store.ts` — the cart's contract applied to the session:
  `useSyncExternalStore`, empty server snapshot, filled from `GET /api/session` after mount.
  `account-button.tsx`, `review-form.tsx` and `product/save-button.tsx` read it and render signed-out until it
  says otherwise. **None of them is a permission check.**
- `components/account/session-sync.tsx` (the storefront shell) re-reads the session on pathname change, because
  signing in navigates before client code gets a say. Refreshes are **sequence-numbered** so a stale reply cannot
  overwrite a newer one; **do not reintroduce in-flight deduplication**, which caused exactly that bug.
- `/p/[slug]` reads reviews through `unstable_cache` tagged `reviews:<slug>`, so anonymous traffic gets built
  HTML and never reaches Postgres. Posting calls **`updateTag()`, not `revalidateTag()`** (which serves the
  writer the stale copy their own review is missing from), then `refresh()` from `next/cache`.
- Auth actions **do not `redirect()`**: they return where to go and the form navigates, fields held in state so
  a rejected password does not empty the form. Without JS the account is still created.
- Review paging is a server function with a cursor (`pdp/review-more.tsx`), not `?page=` — reading
  `searchParams` would make all 470 pages request-time. Keyset on `(created_at, id)` so a review posted
  mid-read cannot repeat a row.

**One flow, two steps.** `/signin` and `/signup` are the same two screens on two paths
(`account/auth-flow.tsx` picks, `auth-steps.tsx` holds step two): an address, then a password if it has an
account, or a name and new password if not.

- **The step is in the URL, not state.** Continue is a plain GET form landing on `?email=…`, looked up on the
  server: step one needs no JS, Back/Change are ordinary links, a reload stays put. `/signin` was already
  dynamic for the cookie read, so the `searchParams` read is free.
- **`accountExists()` is a deliberate hole in that file's rule 2** — two different second screens confirm
  whether an address is registered however they are worded. The lockout is untouched.
- The strength meter scores four rules but **gates on only the two `checkRegistration` enforces** (eight
  characters, a letter, a number), so it never blocks a password the server would take; the disabled Create
  account button is that same predicate. Capitals and symbols are advice.
- **Your name** is the one field the reference flow lacks: reviews are attributed by display name and there is
  no settings page to change it later.
- Providers appear on step one only, where "sign in" and "create an account" are the same press — hence
  `OAuthButtons` carries one label, not a mode.

**The honesty rule the reviews block exists to hold.** `product.rating`/`product.reviews` are the source
listing's aggregate; reviews written here are ours. Shown as two labelled figures and **never averaged into
one**. `ratingBreakdown()`, which fitted a curve to the source average to draw per-star bars, is **deleted**:
bars count real rows, and a product with no reviews here shows none. "Verified purchases only" is gone too —
there is no checkout, so nothing can be verified.

**Google / Facebook sign-in sits on top of that, replacing none of it**: a provider is another way to reach
`startSession()`; `users`, sessions and the DAL are untouched. `lib/oauth.ts` describes one authorization-code
flow as data, an entry per provider. `/api/auth/[provider]` starts it, `/api/auth/[provider]/callback`
finishes it. No client JS: buttons are links, the rest is redirects.

- **A provider whose credentials are unset does not appear** (`configuredProviders()` reads the env), so there
  is never a button leading to a broken consent screen.
- **What makes it safe, in order.** `state` is random, in a short-lived httpOnly cookie, compared
  constant-time on return. PKCE keeps the verifier in that cookie and sends only its SHA-256 (Google requires
  it; Facebook's token endpoint takes it inconsistently, so it is a per-provider flag, off there). The code is
  exchanged server-to-server with the client secret and identity comes from the provider's own endpoint —
  nothing in the query string is treated as who somebody is. `?next=` goes through the same local-path check
  the sign-in form uses.
- **Accounts link on a verified email and nothing else.** `linkOrCreateAccount` tries the `identities` row,
  then a *verified* address matching an existing account, then creates one. An unverified match is **refused
  outright** — otherwise somebody registers your address at a provider that does not check it and walks into
  your account. A Facebook account with no email gets one here with none: `users.email` and
  `users.password_hash` are both nullable, and `authenticate()` refuses a row without a password.
- The cookie is `SameSite=Lax`, not Strict: the provider returns people with a top-level GET that Strict would
  not attach it to, leaving the callback nothing to check `state` against.
- Failures return `/signin?error=<reason>`; the page turns each reason into something readable.

Two `auth-check.mjs` traps. `page.textContent('body')` also reads the RSC flight data Next embeds in
`<script>` tags, so "is it gone" is a false pass — use `innerText`. And navigation waits on
`domcontentloaded`, not `networkidle`, because the footer links to six routes that do not exist
(`/help/delivery`, `/help/returns`, `/help/contact`, `/account/orders`, `/quality`, `/sourcing`) and their
prefetches never settle.

## Internal dashboard

`/admin` — a private, read-only survey for a named few: overview, accounts, reviews, products, search.
It exists because nothing else aggregates what the database holds, and because until now nothing at
all recorded what people look at.

- **The gate is `lib/admin.ts`, and it is an env allowlist.** `ADMIN_EMAILS`, comma-separated,
  checked after the ordinary sign-in. Unset means nobody and `/admin` 404s for everyone — there is
  no default administrator. Revoking is an env edit rather than a migration, and there is no admin
  column for a stray update to flip. `requireAdmin()` sends a stranger to `/signin` and answers a
  signed-in non-admin with **`notFound()`, not 403**, so a guessed URL discloses nothing. Every page
  calls it for itself; the layout's call is for the bar and the tabs.
- **Nothing on this site verifies an email address** — it sends no mail at all — so whoever
  registers an allowlisted address first gets in. **Create the accounts, then add the addresses.**
- `lib/dal.ts`'s rule that no email reaches a component holds where it matters: `isAdmin()` looks the
  address up inside the module and lets only a boolean out. `/admin/accounts` is the one surface on
  the site that displays an address, and that is what the gate is protecting.
- **Read-only by construction** — no action, no form, no mutation. A leaked admin session discloses
  and cannot damage. Nothing stands in front of it either — `requireAdmin()` on each page is the
  whole gate, and there is no proxy to mistake for one.

**The counters** are `lib/schema/003_analytics.sql`, written by `lib/analytics.ts` and read by
`lib/admin-stats.ts`: `product_views`, `page_views`, `search_queries`, each a `(thing, day)` primary
key over an integer bumped by one upsert. No visitor id, no cookie, no IP, no per-event row — they
answer "how many", never "who", and that is the whole design rather than a gap in it.

- **`day` is Bangkok's, never `current_date`.** The Neon branch runs in GMT, so the two disagree for
  the first seven hours of every Thai day and the evening peak would file under yesterday. The zone
  is passed as a parameter — `(now() at time zone $n::text)::date` — so it lives in one constant.
- **`POST /api/track` is the only writer, and every key is validated against something the server
  already knows**: a slug through `getProduct()`, a surface against a fixed set, and the search
  result count from `search()` — **never from the request body**. It answers 204 to everything, so
  probing it maps nothing. No CSRF token, deliberately: a forged call can only nudge an anonymous
  counter.
- **Anyone on the allowlist is excluded from every counter.** `/api/track` calls `isAdmin()` and
  drops the write, so the two people who open every page while building the shop cannot inflate the
  figures they then read — on a small shop that fraction is large, and it is the one fraction that
  is definitely not a customer. This is why the beacon's fetch must keep its default
  `credentials: "same-origin"`: the session cookie is what identifies the request as an admin's.
  Cost is nil for anonymous traffic, since `readSession()` returns null without a query when there
  is no cookie.
- **`components/analytics/view-beacon.tsx` is a client island because the counted pages must stay
  prerendered** — `/p/[slug]` is 470 built pages, and a server-side insert there would either break
  the prerender or never run again. A module-level `Set` dedupes per JS context, and there is
  deliberately **no `AbortController`**: this is the one place where aborting on unmount is wrong,
  because unmount is the navigation being recorded. So a view is a product opened by a browsing
  context — not a hit and not a person. Bots mostly do not run JS, which excludes crawlers for free.
- **Search is counted on a submitted `/search` only.** `/api/search/suggest` writes nothing — it
  calls `suggest()` and returns — so keystrokes are not logged however that route is cached, which
  is what keeps the figure honest now that Cloudflare lets those requests reach the Worker. What
  the panel shows is intent-to-search, which is the more useful figure — and **the queries that
  returned nothing are the point of the page**.
- Averages on `/admin/products` count **our** reviews only; the harvested aggregate is never mixed
  in. `sold30d` appears nowhere on the dashboard — it describes trade at the source, not here.
- Charts are hand-rolled inline SVG (`components/admin/bar-chart.tsx`), stretched with
  `preserveAspectRatio="none"`, which is why every bar is a plain rect: rounded corners, strokes and
  text would distort with it. No charting library — the project runs on five dependencies.
- **It is a site of its own, dressed as a terminal.** `/admin` sits **outside** the `(storefront)`
  route group, so the only layout above it is the document: no utility bar, no masthead, no category
  nav, no footer, no cart drawer. A full-width title bar, a shell prompt, lowercase tabs and a status
  line stand in, and the two links in that title bar are the only way back out. The `term-*` tokens
  run dark navy to near-black with cyan accents and `term-alert` for a zero worth noticing.
  **Nothing here uses the brand palette** except `turmeric-500`, `sold` and `star`, which all hold up
  on that ground.
- **JetBrains Mono is loaded in `app/admin/layout.tsx`, not the root layout**, so it is requested on
  `/admin` and nowhere else. It binds `--font-jetbrains`, which `@theme` reads through `--font-term`;
  a separate token rather than overriding `--font-mono`, so nothing on the storefront changes face.
- `node reference/admin-check.mjs` covers all of it and **puts every counter it touches back**, so
  unlike `auth-check.mjs` it is safe to point at the real project. The dashboard half needs
  `ADMIN_EMAILS=admin-check@slimwellness.test` on the allowlist or it SKIPs.

## Home hero

Two tabs in `components/home/hero-carousel.tsx` — the only client component above the fold — each holding its
own slideshow. `home-hero.tsx` is the server half: it composes both slide lists off the catalogue and checks
every photograph on disk before passing a path down, so a missing asset cannot break the build. It is the only
half that imports `lib/catalog.ts` (importing it client-side would ship the whole generated catalogue); the two
meet at the types in `hero-slides.ts`.

- **The pill switches topic, the arrows move within it.** Supplements advances through the shelves (opening
  slide, then Vitamins, Minerals, Immunity, Omega, Herbs — heading, blurb and in-stock count off `CATEGORIES`),
  Medical equipment through four ranges. **No arrow ever crosses to the other topic**, and **the slideshow
  wraps both directions**, so both arrows stay live and no button is ever disabled — one that disables itself
  as it fires hands keyboard focus back to the document.
- **It rotates on its own, and that is what wrapping was for** — a slide holds for `ROTATE_MS` (6.5s),
  then the rotation calls the same wrap as the right arrow, so it runs the shelves in a ring. It stops
  while the pointer is over the banner or focus is inside it (`held`) and never starts under
  `prefers-reduced-motion`; there is **no pause control** — hovering is the only stop, which is the one
  place the hero does not meet WCAG 2.2.2. The timer is a timeout keyed on the position, so an arrow or
  dot press restarts the clock instead of inheriting the last slide's remainder.
- **The control cluster is one pill from `sm` up and two stacked rows below it.** Two labels and six
  dots come to 328px against the 343px a 375px phone gives the frame, 48px of which is the indent, so
  on one row the last dots fall outside a frame that clips rather than scrolls. The split is explicit,
  not `flex-wrap` (which breaks in a different place at every width), and the plum ground moves to
  whichever element is the pill at that width.
- **Medical equipment is locked.** `locked` on its `TABS` entry closes the topic; the tab still shows, because
  that shelf is coming. `aria-disabled` with a no-op press, **not** a `disabled` button — `disabled` gets no
  pointer events, losing the `not-allowed` cursor and hover title that say why. Unlocking is deleting the flag;
  panel, slides and saved position are still wired up.
- **Two nested tracks, not one flat track** — flat, a tab switch animates through intervening slides. The outer
  track moves between topics, each panel's inner track within one, and **each tab keeps its own position**.
  Every slide stays mounted for a stable height and carries `inert` unless on screen, or an off-screen CTA is a
  tab stop for a slide nobody can see.
- **Position within a tab is the dot row** in the tab pill: one dot per slide, `aria-current` on the live one,
  press to jump. On a phone the label shortens to "Equipment"; the `aria-label` stays the full name, so the
  accessible name does not change with the viewport.
- **Each supplements slide has its own photograph, and the photographs are imported.** `SHELVES` pairs shelf
  to an imported image, so adding or reordering is a file drop plus an import and a missing file is a build
  error. It used to be a path checked with `existsSync` against `public/`, which looked safe and was the
  opposite: **a Worker has no filesystem**, so in production every check failed and the hero shipped with no
  photograph at all — see Deployment. Nothing
  hardcodes the count — frame, dot row and `hero-check.mjs` all count them. **Every shot must be composed like
  the flat-lay** (subject in the right-hand two thirds, bare wood left), because the copy column sits in the
  empty half — its left 43%.
- **Supplements slides are photographs with copy on them and carry no products.** Four best-seller tiles used
  to sit beside the copy, repeating the grids right below the banner; do not bring them back.
- **21:9 from `lg` up, content-driven below.** 21:9 on a phone is a 160px letterbox, so below `lg` the shot
  becomes a band across the foot with copy above, sized by percentage not aspect ratio. One `Image` carries
  both compositions, so the hero preloads one file; `object-position` is biased down and right.
- **Body copy on a supplements slide runs a step heavier than elsewhere** — `font-medium` and plum, because
  wood grain eats 400-weight type; deepening the wash instead makes the copy half read as a pasted panel. Its
  button is the ordinary primary button, not `btn-cart`.
- **Each slide owns its background; there is no cross-fade** — slides translate on one flex track and the
  equipment slide carries `banner-clinic` itself. `h-full` down the outer track, panels and inner tracks hands
  the frame's 21:9 height to the slides; between `lg` and `xl` that height is shortest (425px at 1024), which
  is why the equipment glyph plate shrinks in exactly that range.
- The frame carries a hairline `ring-line`, or a near-white photograph's rounded corners read as a fault. The
  control cluster is left-aligned with the copy, not centred, and its strip takes no pointer events or it would
  eat presses along the whole foot of the frame.
- The equipment side has no catalogue behind it: a slide is one of four ranges from `equipment-glyphs.tsx` as
  line art — name plus a short spec, no prices, Shop Now to `/equipment`.

## Starter kits

`/starters` and the home band under the hero. `lib/starters.ts` composes each kit **by rule, not by slug**: a
kit is a list of roles ("a magnesium glycinate under ฿600"), each filled with the best-selling in-stock match,
so a catalogue refresh re-resolves the kits instead of pointing at a dead product. An unfillable role is
dropped; a kit under two items is not published.

Audience is 16 and up, and the guardrails are code:

- `EXCLUDED` keeps children's lines and the whole `kids` category out of every kit. Most gummies in stock are
  children's lines, which is why no kit leads on format.
- Melatonin is excluded from every kit, deliberately, while staying on the sleep shelf with its guide — see
  `#what-we-wont-do` on `/starters`.
- Value is real numbers only: sum of item prices, a markdown only when every item has a `listPrice`, days
  supply from `servings`. No bundle discount is implied because there isn't one.
- No claim copy. `starters-check.mjs` sweeps both surfaces for weight-loss, focus and exam-result phrasing,
  skipping `#what-we-wont-do` — the one block allowed to name those claims, because it refuses them.
- `components/starters/add-kit.tsx` adds every item in one press; the cart's `add` composes in a loop because
  each call reads and writes the same external snapshot.

## Guides

`/guides` and `/guides/[slug]` are the editorial side, the one part written rather than harvested.
`lib/guides.ts` holds all six articles as structured data, so there is no markdown renderer and nothing to
sanitise. Reading time is counted off those words at 220wpm, so the label cannot drift from the article.

The copy rules are the catalogue's rules applied to prose: reference intakes are quoted as population figures
and named as such, label arithmetic (IU/mcg, elemental versus compound weight, EPA+DHA per softgel) is
checkable against the bottle in your hand, and no sentence needs a study the site cannot show you. The COA
guide states plainly that Slim Wellness Asia runs no laboratory. **The footer and utility strip still carry
older "we publish the certificate of analysis for every lot" copy, which contradicts that — worth
reconciling.**

Photography is harvested, not ours. `reference/editorial/photos.mjs` pulls one CC0 / public-domain / CC BY
photo per guide from Openverse, downscales to 2000px through Next's own `sharp`, and writes the credit to
`lib/editorial.generated.json`; `guides-check.mjs` asserts a credit exists for every cover, because a missing
one puts a CC BY image out of licence. Modern stock sources are tried before Flickr and Wikimedia, and museum
archives never. Covers are reviewed by eye then pinned by image id in `PICKS`.

Card sizes in `components/guides/guide-card.tsx`: `GuideFeature` (16:9 lead), `GuideCard` (3:2 grid),
`GuideRow` (thumbnail beside the headline).

## Catalogue data

`reference/iherb/` is a three-stage pipeline — `discover` (listing pages -> `urls.json`), `harvest` (product
pages -> `products/<pid>.json` plus `public/products/iherb/*.jpg`), `build` (->
`lib/catalog.generated.json`). **Read `reference/iherb/README.md` before touching it**; the bot check dictates
the whole design.

- **Real, from the source page**: title, brand, THB price, availability, 30-day volume, rating and review
  count, product code, UPC, package quantity, serving size, servings per container, best-by, first available,
  shipping weight, dimensions, certification and quality marks, highlight bullets, overview copy, suggested
  use, other ingredients, warnings, storage, and the supplement-facts table including %DV.
- **Computed from two real numbers**: discount percent. (`perServing` is still emitted but shown nowhere.)
- **Real, restated at today's rate**: the price the storefront shows. See Currency.
- **Ours**: the storefront's own handling standards and site disclaimer — the source's own disclaimer names the
  source and is deliberately not copied. `ratingBreakdown` used to be here and is gone.
- **A field the source does not state comes through as `null` or an empty array and its panel renders
  nothing.** Keep that rule when adding fields: it is what stops the page claiming a %DV or best-by date no
  label backs.
- Stage 3 does all interpretation, so changing how a field is read is a `build.mjs` edit plus a rerun, never a
  re-scrape. Stage 2 caches per product, so an interrupted run resumes.

## Currency

The catalogue stores what iHerb charged in THB on the harvest day, frozen at that day's rate. `lib/fx.ts`
unfreezes it: `adjust()` restates a price at today's rate and `lib/catalog.ts` applies it once in the mapper,
so filter bands, sorting, kit totals and the free-delivery threshold all see plain THB.

- **Two rates, and mixing them up costs a slice of margin.** `HARVEST_MARKET_RATE` is the *market* rate on the
  harvest date, deliberately not the rate iHerb charged. Stored price is `usd x iHerb's rate`, which carries
  their spread (the harvest implies 32.81/USD on a day the market closed at 32.735, ~0.23% over). The ratio of
  two market rates moves each price by exactly what the market moved and leaves that spread inside the figure;
  dividing by iHerb's 32.81 would shave it off every price, once, silently. On a re-harvest this constant wants
  **the market rate for the new harvest date**, not the rate the new prices imply.
- **Prices round up to the whole baht** (`Math.ceil` in `adjust`) — every price stays at or above what it
  converts to and none moves by more than ฿1. `price()` prints two decimals, so the shopper sees `฿357.00`;
  the satang are a display convention and always `.00`. No charm pricing, nothing nudged to ฿599 — ฿9 is a
  margin decision and does not belong inside a currency conversion.
- **The rate is a committed build input, not a runtime lookup**, because `lib/catalog.ts` is synchronous and
  imported by every page. `reference/fx.mjs` reads the ECB daily reference rate (falling back to
  `open.er-api.com`), refuses anything outside 25-45 as a broken response, and **writes only once the rate has
  moved more than 0.5%**. `.github/workflows/exchange-rate.yml` runs it on weekdays just after the ECB
  publishes and commits when it wrote, landing on `main` for Cloudflare's git deploy.

## Deployment

Cloudflare Workers, built by **OpenNext** (`@opennextjs/cloudflare`), deployed from `main` by Cloudflare's
git integration. It is not a static export: `/c/[slug]`, `/search`, `/signin`, `/signup`, `/account/*`,
`/admin/*` and the five route handlers render at request time, and the 470 prerendered product pages ship
as static assets beside the Worker.

- **The Workers Builds commands are `npx opennextjs-cloudflare build` and `npx wrangler deploy`, in that
  order, and the build one is not optional.** `wrangler deploy` does not build this project: it detects a
  Next.js app with an `open-next.config.ts` and delegates to `opennextjs-cloudflare deploy`, which reads
  the compiled config out of `.open-next/.build/` and exits with *Could not find compiled Open Next
  config* if the bundle is not already there. A build command of `npm run build` — plain `next build` —
  leaves the Worker unbuilt. The delegation also pre-empts a `build.command` in `wrangler.jsonc`, which is
  why there is none: it would only fire in the inner `wrangler deploy` and bundle a second time.
- **`wrangler.jsonc` and `open-next.config.ts` are committed, and that is the point.** `wrangler deploy`
  runs its framework auto-configuration only when it finds no Wrangler config — so every deploy was
  installing the adapter into a throwaway container, rewriting `package.json` and `next.config.ts` there,
  and failing. Both files are in the repo and the adapter and `wrangler` are pinned devDependencies.
- **`compatibility_flags` must keep `nodejs_compat`** — `pg` reaches for `node:crypto`, `node:events` and
  `node:stream`, and `lib/password.ts` hashes with scrypt from `node:crypto`.
- **`next.config.ts` traces `pg-cloudflare` in on purpose, and the build fails without it.** `pg` picks its
  socket at runtime: `node:net` under Node, `pg-cloudflare`'s `CloudflareSocket` when it detects a Worker.
  That package exports `dist/index.js` under the `workerd` condition and a do-nothing `dist/empty.js`
  otherwise; Next traces with Node's conditions and copies only the empty one, then the adapter bundles the
  server under `workerd`, asks for the real file and dies on `Could not resolve "pg-cloudflare"`.
  `outputFileTracingIncludes` puts it where esbuild looks. Symptom is a build failure, never a runtime one.
- **`next` must satisfy the adapter's peer range** (`>=15.5.24 <16 || >=16.3.3`). 16.3.2 did not, and
  OpenNext patches the Next server at build time — an unsupported pair is not a warning worth carrying.
- **Incremental cache is not set up**, the one thing this deployment still lacks. Reviews are read through
  `unstable_cache` tagged `reviews:<slug>` and posting calls `updateTag()`; with no cache binding there is
  nothing for that tag to invalidate, so a review lands on its prerendered product page at the next deploy
  rather than at once. Unlocking it: create the R2 bucket, uncomment the two blocks in `wrangler.jsonc` and
  the override in `open-next.config.ts`.
- **`npx opennextjs-cloudflare build` cannot finish on Windows without Developer Mode** — OpenNext symlinks
  traced packages and Windows refuses `symlink` without it (junctions are permitted, symlinks are not).
  `next build` is unaffected; CI is Linux and unaffected.
- **Nothing may touch the filesystem at request time.** A Worker has no filesystem: `node:fs` under
  `nodejs_compat` is a stub, and `existsSync` answers false for a file that is demonstrably deployed and
  serving. `home-hero.tsx` and `trust-band.tsx` both gated their photographs behind exactly that check, so the
  hero and the trust band shipped with no image while every product photograph was fine. Anything derived from
  disk must be resolved by the bundler (import the asset) or generated into a module at build time, the way
  `catalog.generated.json` is. It fails silently, not loudly, which is what makes it worth a rule.
- **The free plan caps a Worker at 3MiB gzipped**, and Next 16 on OpenNext spends most of that on its own
  server runtime — this one measured ~2.7MB before the proxy came out, ~2.1MB after. It fits, with little
  room: a new dependency in the request path is now a size decision. Paid Workers raises the cap to 10MiB.
- Environment variables live in the Worker's settings: `DATABASE_URL` (unset switches accounts off),
  `ADMIN_EMAILS` (unset means nobody), `OAUTH_REDIRECT_ORIGIN` plus the optional `GOOGLE_*` / `FACEBOOK_*`
  pairs. A provider whose pair is blank shows no button.

## Reference material

`reference/NOTES.md` — measured iHerb tokens, per-page anatomy, and what was deliberately not copied (three
stacked interruptions, six-element product cards, promo-led hero). `reference/shots/` holds the source
screenshots; `reference/capture.mjs` re-captures them.

## Git

This folder is its own repository, on `main`, pushed to `github.com/gregorton/nutriva`.
