// Applies lib/schema/*.sql in filename order, once each.
//
// Same shape as the harvest scripts in reference/iherb/: plain .mjs, run with node, resumable.
// Already-applied versions are recorded in schema_migrations and skipped, so running this twice
// is a no-op and adding 002_*.sql only applies the new file.
//
//   node reference/db/migrate.mjs

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// `next dev` loads .env.local itself; plain node does not.
try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch {
  // no .env.local — fall through to whatever is already in the environment
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon string.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  create table if not exists schema_migrations (
    version    text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = new Set(
  (await client.query("select version from schema_migrations")).rows.map((r) => r.version),
);

const dir = path.join(root, "lib/schema");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

let count = 0;
for (const file of files) {
  const version = file.replace(/\.sql$/, "");
  if (applied.has(version)) {
    console.log(`· ${version} already applied`);
    continue;
  }

  const sql = await readFile(path.join(dir, file), "utf8");
  // One transaction per file: a migration either lands whole or not at all.
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("insert into schema_migrations (version) values ($1)", [version]);
    await client.query("COMMIT");
    console.log(`✓ ${version} applied`);
    count++;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`✗ ${version} failed:`, error.message);
    await client.end();
    process.exit(1);
  }
}

console.log(count ? `\n${count} migration(s) applied.` : "\nSchema already up to date.");
await client.end();
