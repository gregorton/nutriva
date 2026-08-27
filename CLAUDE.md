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

Set up the database (see Accounts and reviews; needs `DATABASE_URL` in `.env.local`):

```bash
node reference/db/migrate.mjs && node reference/db/seed.mjs
```

Screenshot the running dev server at desktop and mobile (writes `reference/preview/`, gitignored):

```bash
node reference/shoot.mjs label
```

## Architecture

Next.js 16.3 App Router, React 19, Tailwind v4, TypeScript. Two data sources and no other backend:
the static catalogue module, and PostgreSQL for what visitors write.

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
- Routes: `/` home, `/c/[slug]` category (dynamic — reads searchParams), `/p/[slug]` product (SSG, 470
  paths), `/starters`, `/deals`, `/equipment`, `/search`, `/guides` + `/guides/[slug]` (SSG, one per
  guide), `/signin`, `/signup`, `/account` + `/account/saved` + `/account/reviews` (dynamic — they read
  the session cookie), `/api/session` (the one route handler), `not-found`.
- `components/chrome/sticky-chrome.tsx` — pins the masthead and category row to the top of the
  viewport; the utility strip above scrolls away for good. Pinned state is measured off layout
  (`getBoundingClientRect().top <= 0`) through `useSyncExternalStore`, not stored in state from an
  effect, and published as `data-stuck` so children condense off `group-data-[stuck=true]/chrome:`
  — the masthead drops 72px → 58px and the mobile search row folds away, leaving the search icon
  beside the cart. Pinned height is the `--spacing-chrome` token (103px): `html`'s
  `scroll-padding-top` and the PDP buy box's sticky offset both read it, so changing the chrome's
  height is a one-line edit.
- Everything is a server component except the cart, category-nav panel, sort select, countdown,
  rail scroller, sticky chrome, the product-gallery zoom, and the account/review/save islands
  described under Accounts and reviews.

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
| The medical-equipment side (banner field, glyphs) | `clinic-900` → `clinic-500`, `clinic-100` | `#0e3a6b` → `#1b5ca7`, `#eef3f9` |
| Neutrals | `ink` `muted` `line` `paper` `paper-warm` | warm greys, `#fbf9f5` bands |

One face, every job: **Inter**, loaded variable in `app/layout.tsx` and pointed at by both
`--font-sans` and `--font-display`. Size, weight and tracking separate a heading from a paragraph
from a spec row; `font-variant-numeric: tabular-nums` keeps figures aligned in grid columns. The
`font-display` utility is kept so headings can be retargeted in one place if a second face is ever
added. Inter carries no Thai, so localisation will need one added alongside it.

Custom utilities: `shell` (page container), `facts` (12px tabular data type), `kicker` (uppercase
eyebrow), `btn-cart` (the gradient add-to-cart, every placement), `banner-plum` / `banner-clinic` (the
two full-bleed banner ramps), `.rail` (snap scroller), `.reveal-add` (hover-reveal add-to-cart, see
below).

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
- The Reviews block at the foot of the page is real and comes from PostgreSQL — see Accounts and
  reviews. It shows two ratings side by side and never averages them together.
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

## Accounts and reviews

The second data source: PostgreSQL, hosted on Neon, holding the four things the catalogue cannot —
accounts, sessions, reviews and saved items. `DATABASE_URL` in `.env.local` is the only secret the
project has. With it unset the site still builds and runs; `isConfigured()` in `lib/db.ts` switches
the whole feature off rather than erroring, which is also what keeps a build working in an
environment with no database.

- `lib/db.ts` — one `pg` pool, parked on `globalThis` so `next dev` does not leak a socket set per
  hot reload. `query`, `queryOne`, `tx`. TLS is verified (Neon's chain is one Node trusts, so
  there is no reason to weaken it); localhost is the exception, having no certificate to verify.
  **Every statement is parameterised** — nothing in this codebase interpolates a value into SQL.
  Placeholders used twice in one statement carry an explicit `::type`, or Postgres refuses to
  deduce one type for them; see the lockout update in `lib/accounts.ts`.
- `lib/schema/*.sql` + `reference/db/migrate.mjs` — numbered migrations (`001_init`, `002_oauth`), one transaction each,
  recorded in `schema_migrations` so re-running is a no-op. `reference/db/seed.mjs` fills three
  accounts and a few reviews, picking products off the real catalogue so it cannot rot.
- `lib/password.ts` — scrypt from `node:crypto` (no native addon to compile), stored as
  `scrypt$N$r$p$salt$hash` so the cost can be raised without invalidating anyone. It is a separate
  file with no `server-only` import because `seed.mjs` imports it too — Node 26 strips the types.
- `lib/session.ts` — the cookie carries 32 random bytes; the table stores only their SHA-256, so a
  dumped row cannot be replayed. `secure` is on in production only, or the cookie never sets over
  http://localhost.
- `lib/dal.ts` — `getUser()` (React `cache`d, returns a two-field DTO, never the row) and
  `requireUser()`. Everything that touches per-user data goes through here rather than reading the
  cookie, so the check cannot be forgotten. Its catch calls `unstable_rethrow` first: reading
  cookies during a prerender throws a framework signal meaning "render this route at request
  time", and swallowing it would render the page as though nobody were signed in. Nothing under
  `/account` sets `force-dynamic` — the cookie read already makes those routes dynamic, and
  forcing it as well stops `refresh()` from an action updating the page in place. `proxy.ts` (Next
  16's renamed middleware) only checks whether a cookie exists at all, to keep a database round
  trip off every prefetch.
- `lib/accounts.ts`, `lib/reviews.ts`, `lib/saved.ts` — query modules, the same "one module is the
  whole boundary" shape as `lib/catalog.ts`. `app/actions/*.ts` are the mutations, and every one
  re-verifies the session: a Server Action is a POST endpoint anything can call.

**Keeping the site static is the constraint that shaped all of it.** The masthead lives in the root
layout, so a server component there awaiting `cookies()` would turn every route in the app dynamic
and cost all 470 product pages their prerender. Three consequences, and none of them are optional:

- `components/account/account-store.ts` is the cart's contract applied to the session —
  `useSyncExternalStore` with an empty server snapshot, filled from `GET /api/session` after mount.
  `account-button.tsx`, `review-form.tsx` and `product/save-button.tsx` all read it and all render
  the signed-out state until it says otherwise. None of them is a permission check.
- `components/account/session-sync.tsx` sits in the root layout and re-reads the session whenever
  the pathname changes. It has to: setting a cookie in an action makes Next re-render the route on
  the server, and `/signin` and `/signup` redirect once a session exists, so signing in navigates
  before any client code gets a say — an island refreshed only by the form would keep saying
  "Sign in" to somebody who had just signed in. Refreshes are sequence-numbered so a stale reply
  cannot overwrite a newer one; do not reintroduce in-flight deduplication, which is what caused
  exactly that bug.
- `/p/[slug]` reads reviews through `unstable_cache` tagged `reviews:<slug>`, so anonymous traffic
  is served built HTML and never reaches Postgres. Posting calls `updateTag()` — not
  `revalidateTag()`, which would serve the writer the stale copy their own review is missing from —
  then `refresh()` from `next/cache` to pull that render into the page they are looking at.
- Auth actions do not `redirect()`; they return where to go and the form navigates, with the
  fields held in state so a rejected password does not empty the form. Without JavaScript the
  account is still created and the page offers a Continue link.
- Review paging is a server function with a cursor (`components/pdp/review-more.tsx`), not a
  `?page=` parameter, because reading `searchParams` would make all 470 pages request-time.
  Pagination is keyset on `(created_at, id)`, so a review posted mid-read cannot repeat a row.

**Getting into an account is one flow in two steps**, and `/signin` and `/signup` are the same two
screens mounted on two paths (`components/account/auth-flow.tsx` decides which,
`auth-steps.tsx` holds the second): an address, then a password if that address has an account, or a
name and a new password if it does not. There is no card behind any of it — fields, buttons and one
heading on the page's own white.

- **The step is in the URL, not in state.** Continue is a plain GET form landing on `?email=…`, and
  the flow looks the address up on the server to pick the second screen. So step one needs no
  JavaScript, Back and Change are ordinary links the browser's own back button agrees with, and a
  reload stays on the screen it was on. The address sitting in the URL is the cost; `/signin` was
  already dynamic for the cookie read, so the `searchParams` read is free.
- **`accountExists()` in `lib/accounts.ts` is a deliberate hole in that file's rule 2.** A flow with
  two different second screens confirms whether an address is registered however either screen is
  worded, so moving the question into its own lookup leaks nothing the screens do not. The lockout is
  untouched: knowing an address exists is still ten wrong guesses from getting in.
- The strength meter scores four rules but gates on only the two `checkRegistration` enforces —
  eight characters, a letter and a number — so it never blocks a password the server would take, and
  the disabled Create account button is that same predicate rather than a second opinion. Capitals
  and symbols are advice, which is why the bar can sit at half with the button live.
- The one field the reference flow does not have is **Your name**, because reviews are attributed by
  display name and there is no settings page to change it on later.
- Providers appear on step one only: there, "sign in" and "create an account" are the same press,
  which is why `OAuthButtons` carries one label rather than a mode.

**The honesty rule the reviews block exists to hold.** `product.rating` and `product.reviews` are
the source listing's aggregate; reviews written here are ours. They are shown as two labelled
figures side by side and are **never averaged into one** — a blended number is stated by no source
and cannot be shown the working for. `ratingBreakdown()`, which fitted a curve to the source average
to draw the per-star bars, is deleted: the bars now count real rows, and a product nobody has
reviewed here shows no bars at all. The "Verified purchases only" kicker is gone too — there is no
checkout, so no purchase can be verified. Reviews are attributed to an account, and that is all the
block claims.

**Signing in with Google or Facebook** sits on top of all of that rather than replacing any of it: a
provider is another way to reach `startSession()`, and the `users` table, the sessions and the DAL
are untouched. `lib/oauth.ts` holds one authorization-code flow described as data, with an entry per
provider — adding a third is an entry plus a button. Two route handlers do the work:
`/api/auth/[provider]` starts it, `/api/auth/[provider]/callback` finishes it. No client JavaScript
is involved; the buttons are links and the rest is redirects.

- **A provider whose credentials are unset does not appear.** `configuredProviders()` reads the
  environment, so the same code runs configured or not, and there is never a button leading to a
  broken consent screen. Everything else on the page works regardless.
- **What makes it safe, in the order it matters.** `state` is random, kept in a short-lived
  httpOnly cookie and compared constant-time on the way back — a callback that cannot produce it
  did not start here. PKCE keeps the verifier in that cookie and sends only its SHA-256, so an
  intercepted code cannot be exchanged (Google requires it; Facebook's token endpoint takes it
  inconsistently across versions, so it is a per-provider flag and off there). The code is
  exchanged server-to-server with the client secret, and identity comes from the provider's own
  endpoint — nothing in the query string is treated as who somebody is. `?next=` goes through the
  same local-path check the sign-in form uses, because it decides where a signed-in person lands.
- **Accounts link on a verified email and nothing else.** `linkOrCreateAccount` in `lib/accounts.ts`
  tries the `identities` row first, then a *verified* address matching an existing account, then
  creates one. An unverified address that matches an existing account is refused outright: linking
  it would let somebody register your address at a provider that does not check it and walk into
  your account. A Facebook account with no email at all gets a Nutriva account with none —
  `users.email` and `users.password_hash` are both nullable now, and `authenticate()` refuses a row
  without a password rather than saying it has none.
- The cookie is `SameSite=Lax`, not Strict, because the provider returns people with a top-level GET
  that Strict would not attach it to — and the callback would have nothing to check `state` against.
- Failures come back as `/signin?error=<reason>`, and the sign-in page turns each reason into
  something worth reading. "state mismatch" means nothing to the person looking at it.

Round trip for all of it — signs up a throwaway account, posts and edits a review, saves a product,
signs out and back in, deletes the review through the account page, then deletes the account. The
provider assertions cover the outgoing query string and every refusal, and skip themselves when no
credentials are set. It writes to the database, so point it at a scratch project:
```bash
node reference/auth-check.mjs   # needs the dev server up and DATABASE_URL set
```

Two things that will waste an hour if you do not know them. `page.textContent('body')` also reads
the RSC flight data Next embeds in `<script>` tags, so "is it gone from the page" is a false pass
against it — use `innerText`. And navigation in this script waits on `domcontentloaded`, not
`networkidle`, because the footer links to six routes that do not exist
(`/help/delivery`, `/help/returns`, `/help/contact`, `/account/orders`, `/quality`, `/sourcing`)
and their prefetches never settle.

## Home hero

Two slides in `components/home/hero-carousel.tsx` — the only client component above the fold.
`components/home/home-hero.tsx` is its server half: the four supplement examples are the best
sellers in stock and the figures beside them are counted off the catalogue.

- The right-hand arrow cross-fades `banner-plum` into `banner-clinic`, the ramp the Professional
  brands band also runs. A gradient cannot be transitioned, so the two fields are stacked layers
  whose opacity is animated; the slides themselves translate on one flex track.
- Both slides stay mounted so the height is stable, and the off-screen one carries `inert`.
- The equipment side has no catalogue behind it, so its tiles are the four ranges from
  `components/home/equipment-glyphs.tsx` as line art — name plus a short spec, no prices. Shop Now
  lands on `/equipment`, which lists the same four ranges.

This replaced a five-tile mosaic traced off the reference site's promotional hero, along with its
invented sale copy, hotlinked stock photography and sign-in bar.

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
- **Still ours**: the storefront's own handling standards and the site disclaimer. The source's own
  disclaimer names the source and is deliberately not copied. The per-star rating distribution used
  to be on this list — `ratingBreakdown` shaped it from the average, because the source puts its own
  breakdown behind an identity check. It is gone: the bars on a product page now count reviews
  written here, and nothing invents a distribution for a product that has none. See Accounts and
  reviews.

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
