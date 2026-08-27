// Seeds two accounts and a handful of reviews, so the storefront has something to render before
// anyone signs up. Idempotent: re-running updates the same rows rather than adding more.
//
//   node reference/db/seed.mjs
//
// Products are picked off the real catalogue rather than hardcoded, so a catalogue refresh
// cannot leave the seed pointing at a slug that no longer resolves.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { hashPassword } from "../../lib/password.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch {
  // fall through to the ambient environment
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

const catalog = JSON.parse(await readFile(path.join(root, "lib/catalog.generated.json"), "utf8"));

// Best-selling in-stock products, so the seeded reviews land on pages worth looking at.
const targets = catalog.items
  .filter((item) => item.inStock)
  .sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0))
  .slice(0, 4)
  .map((item) => item.slug);

const PASSWORD = "nutriva123";

const PEOPLE = [
  { email: "demo@nutriva.test", displayName: "Ploy S." },
  { email: "kritsada@nutriva.test", displayName: "Kritsada W." },
  { email: "mint@nutriva.test", displayName: "Mint T." },
];

const REVIEWS = [
  { rating: 5, title: "Third bottle now", body: "Been on this for four months. Pack size is what keeps me buying it — the 180 count works out cheaper per month than the small tubs I was getting locally." },
  { rating: 4, title: "Good, capsules are large", body: "No complaints about the product itself. The capsules are big enough that I split the serving across the day rather than taking both at once." },
  { rating: 5, title: "Arrived in two days", body: "Ordered on a Sunday and it was here Tuesday morning, sealed, best-by well over a year out. Exactly what the listing said." },
  { rating: 3, title: "Does the job", body: "Nothing wrong with it and the label matches the supplement facts here, but I could not tell you it works better than the cheaper one I had before." },
  { rating: 5, title: "Easy on an empty stomach", body: "The only one of these I can take before breakfast without feeling it. Worth the extra over the basic version for that alone." },
];

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

await client.connect();

const userIds = [];
for (const person of PEOPLE) {
  const hash = await hashPassword(PASSWORD);
  const { rows } = await client.query(
    `insert into users (email, password_hash, display_name)
     values ($1, $2, $3)
     on conflict (email) do update set display_name = excluded.display_name
     returning id`,
    [person.email, hash, person.displayName],
  );
  userIds.push(rows[0].id);
  console.log(`✓ ${person.email}`);
}

let written = 0;
for (const [index, slug] of targets.entries()) {
  // Two or three reviews per product, rotating through the pool so no two pages read alike.
  for (let n = 0; n < 2 + (index % 2); n++) {
    const review = REVIEWS[(index * 2 + n) % REVIEWS.length];
    const userId = userIds[n % userIds.length];
    await client.query(
      `insert into reviews (product_slug, user_id, rating, title, body)
       values ($1, $2, $3, $4, $5)
       on conflict (product_slug, user_id)
       do update set rating = excluded.rating, title = excluded.title,
                     body = excluded.body, updated_at = now()`,
      [slug, userId, review.rating, review.title, review.body],
    );
    written++;
  }
  console.log(`✓ /p/${slug}`);
}

// One saved item for the demo account, so /account/saved is not empty on first look.
await client.query(
  `insert into saved_items (user_id, product_slug) values ($1, $2) on conflict do nothing`,
  [userIds[0], targets[1] ?? targets[0]],
);

console.log(`\n${PEOPLE.length} accounts, ${written} reviews. Password for all of them: ${PASSWORD}`);
await client.end();
