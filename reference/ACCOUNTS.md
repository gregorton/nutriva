<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about the account
     area, sessions, the sign-in flow or OAuth. CLAUDE.md keeps a pointer and the invariants that
     bite from outside those surfaces (the DAL rule, dynamic rendering, cache tags, the store). -->

# Accounts, sessions and sign-in

PostgreSQL (Neon) holds what the catalogue cannot: accounts, sessions, reviews, saved items, addresses, orders.
`DATABASE_URL` in `.env.local` is the project's only secret; unset, `isConfigured()` in `lib/db.ts` switches the
feature off rather than erroring, so a build works with no database.

## Storage

- **One `pg` pool on `globalThis`**, or `next dev` leaks a socket set per hot reload. TLS verified, localhost excepted.
- **Every statement is parameterised**; a placeholder used twice needs an explicit `::type`.
- `lib/schema/*.sql` + `reference/db/migrate.mjs` — numbered migrations, one transaction each, recorded in
  `schema_migrations`, so re-running is a no-op. `reference/db/seed.mjs` fills a scratch project.
- **`lib/password.ts` stores `scrypt$N$r$p$salt$hash`** — the cost parameters travel with the hash, so they can be
  raised without invalidating anyone.
- **`lib/session.ts` keeps only the SHA-256 of the cookie's 32 random bytes**, so a dumped row cannot be replayed.
  `secure` is production-only, or nothing sets over localhost.
- Reads go through `lib/dal.ts` (see CLAUDE.md — `getUser()` is a two-field DTO and its catch calls
  `unstable_rethrow` first). `lib/accounts.ts`, `reviews.ts`, `saved.ts` query; `app/actions/*.ts` mutate.

## Account area

- **`lib/profile.ts` is the one read that hands an email address to a component.** No re-authentication on an email
  change, because no password reset exists to turn one into a takeover — **add it with the reset**.
- `lib/addresses.ts` — **one default per account is the partial unique index `addresses_one_default`**, not app logic;
  a write clears the old default in the same transaction. **Nothing else reads the book yet**: checkout still asks,
  its form being a client island on a page open to guests. `/account/payment` stores nothing and says why.
- `saveSlugs` is **`do nothing` on conflict, not a toggle**, so saving a kit routine twice is a no-op rather than a way
  to empty the list. The card heart and "save for later" write the same list.
- Review paging is a cursor server function (`pdp/review-more.tsx`), not `?page=`, which would make all 470 product
  pages request-time.

## One flow, two steps

`/signin` and `/signup` are the same two screens on two paths — `account/auth-flow.tsx` picks, `auth-steps.tsx` holds
step two: an address, then a password if it has an account, or a name and a new password if not.

- **`accountExists()` is a deliberate hole in the DTO rule.** Two different second screens confirm whether an address
  is registered however they are worded; the lockout is untouched.
- **The step is in the URL, not state**: step one needs no JS, Back is an ordinary link, a reload stays put.
- The strength meter **gates on only the two rules `checkRegistration` enforces**, so it never blocks a password the
  server would take.
- **Auth actions do not `redirect()`**: they return where to go and the form navigates, fields held in state so a
  rejected password does not empty the form. (`app/actions/checkout.ts` is the one exception, and says why.)

## OAuth

`lib/oauth.ts` describes one authorization-code flow as data, an entry per provider; `/api/auth/[provider]` starts it,
`.../callback` finishes it. No client JS. A provider is another way to reach `startSession()`, replacing nothing above.

- **A provider whose credentials are unset does not appear** (`configuredProviders()` reads the env).
- `state` is random, in a short-lived httpOnly cookie, **compared constant-time** on return.
- **PKCE sends only the verifier's SHA-256**, behind a per-provider flag — Facebook is inconsistent about it.
- The code is exchanged server-to-server, identity comes from the provider's own endpoint, and **nothing in the query
  string is treated as who somebody is**. `?next=` goes through the local-path check.
- **The cookie is `SameSite=Lax`, not Strict**: the provider returns people with a top-level GET that Strict would not
  attach it to, leaving the callback nothing to compare.
- **Accounts link on a verified email and nothing else.** `linkOrCreateAccount` tries the `identities` row, then a
  *verified* address on an existing account, then creates one. **An unverified match is refused outright** — otherwise
  somebody registers your address at a provider that does not check it and walks into your account.
- A provider account with no email gets one here with none: `users.email` and `password_hash` are both nullable, and
  **`authenticate()` refuses a row without a password**.
- Failures return `/signin?error=<reason>`; the page turns each reason into something readable.
