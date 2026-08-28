import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/*
  PostgreSQL connection — the second data boundary in this codebase.

  `lib/catalog.ts` is the first: the catalogue, static, read from a generated JSON module at
  build time. This one is everything the catalogue cannot hold because it is written by
  visitors rather than harvested: accounts, sessions, reviews, saved items.

  One pool for the process. `next dev` re-evaluates modules on every edit, so a pool created at
  module scope would leak a fresh set of sockets per hot reload until the database refused more
  connections; parking it on globalThis survives the reload. In production the module is
  evaluated once and the branch never matters.

  Every query here is parameterised. `query("... WHERE email = $1", [email])` sends the value
  separately from the statement, so no input can alter the statement. There is no code path in
  this file or its callers that interpolates a value into SQL text.
*/

const globalForDb = globalThis as unknown as { swaPool?: Pool; swaWarned?: boolean };

/**
 * Whether a database is configured at all.
 *
 * `next build` prerenders 470 product pages, each of which reads reviews. With no DATABASE_URL
 * that is a configuration state rather than 470 failures, so callers check this first and the
 * warning is printed once.
 */
export function isConfigured(): boolean {
  if (process.env.DATABASE_URL) return true;
  if (!globalForDb.swaWarned) {
    globalForDb.swaWarned = true;
    console.warn(
      "DATABASE_URL is not set — accounts, reviews and saved items are switched off. " +
        "Copy .env.example to .env.local to turn them on.",
    );
  }
  return false;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon connection string.",
    );
  }

  return new Pool({
    connectionString,
    // Verified TLS — Neon's certificates chain to a root Node already trusts, so there is no
    // reason to disable verification, and doing so would make the connection interceptable.
    // Localhost is the exception: a local Postgres has no certificate to verify.
    ssl: connectionString.includes("localhost") ? false : true,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

export function pool(): Pool {
  return (globalForDb.swaPool ??= createPool());
}

/** One statement, parameterised. Returns the rows only — callers never need the result metadata. */
export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query<T>(text, params);
  return result.rows;
}

/** First row or null, for the many lookups that expect at most one. */
export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Runs `fn` inside a transaction on one client, rolling back if it throws. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
