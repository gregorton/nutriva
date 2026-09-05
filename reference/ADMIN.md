<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about /admin, the
     allowlist gate or the anonymous counters. CLAUDE.md keeps a pointer and the three invariants
     that decide whether a change to those surfaces is safe. -->

# Internal dashboard (`/admin`)

`/admin` — a private, read-only survey for a named few: overview, accounts, orders, reviews, products, search.

- **The gate is `lib/admin.ts`, an env allowlist.** `ADMIN_EMAILS`, comma-separated, checked after the ordinary
  sign-in. Unset means nobody and `/admin` 404s for everyone; revoking is an env edit. `requireAdmin()` sends a
  stranger to `/signin` and answers a signed-in non-admin with **`notFound()`, not 403**. Every page calls it for
  itself, and `proxy.ts` matches `/admin` only for the cookie-presence check: it is not the gate.
- **Nothing here verifies an email address** — the site sends no mail at all — so whoever registers an allowlisted
  address first gets in. **Create the accounts, then add the addresses.** `isAdmin()` lets only a boolean out, holding
  `lib/dal.ts`'s rule that no email reaches a component; `/admin/accounts` is the one surface that shows an address.
- **Read-only by construction** — no action, no form, no mutation, so a leaked admin session cannot damage.
- `/admin` sits **outside** `(storefront)`, so the only layout above it is the document, and **nothing here uses the
  brand palette** except `turmeric-500`, `sold` and `star`. Charts are inline SVG stretched with
  `preserveAspectRatio="none"`, so **every bar must stay a plain rect** — corners and text distort with it.

**The counters** are `lib/schema/003_analytics.sql`, written by `lib/analytics.ts`, read by `lib/admin-stats.ts`:
`product_views`, `page_views`, `search_queries`, each a `(thing, day)` key over an integer bumped by one upsert. No
visitor id, no cookie, no IP, no per-event row — "how many", never "who".

- **`day` is Bangkok's, never `current_date`** — the Neon branch runs in GMT, so the two disagree for the first seven
  hours of every Thai day and the evening peak files under yesterday. The zone is a parameter; the constant lives in
  `lib/delivery.ts`.
- **`POST /api/track` is the only writer, and every key is validated against something the server already knows**: a
  slug through `getProduct()`, a surface against a fixed set, the result count from `search()` — **never from the
  request body**. It answers 204 to everything. No CSRF token: a forged call can only nudge an anonymous counter.
- **Anyone on the allowlist is excluded from every counter** — `/api/track` calls `isAdmin()` and drops the write, so
  the people who open every page while building the shop cannot inflate the figures they read. Hence the beacon's
  fetch must keep its default `credentials: "same-origin"`.
- **`view-beacon.tsx` is a client island because the counted pages must stay prerendered**; a module `Set` dedupes per
  JS context, and there is deliberately **no `AbortController`** — unmount is the navigation being recorded.
- **Search is counted on a submitted `/search` only** — `/api/search/suggest` is CDN-cached and never reaches the
  origin, so keystrokes cannot be logged even in principle. **The queries that returned nothing are the point.**
- Averages on `/admin/products` count **our** reviews only; `sold30d` appears nowhere, describing trade at the source.
  `admin-check.mjs` needs `ADMIN_EMAILS=admin-check@slimwellness.test` or it SKIPs.

