import "server-only";
import { isConfigured, query } from "@/lib/db";

/*
  The write half of the dashboard's counters. Reads are lib/admin-stats.ts.

  Every increment is a single upsert rather than a read followed by a write, so two people
  opening the same product in the same second cannot both read 4 and both write 5.

  Nothing here records who: no visitor id, no cookie, no IP, no per-event row. A counter row is
  (thing, day, how many) and there is no way back from it to a person.
*/

/**
 * The storefront delivers from Bangkok, so "today" is Bangkok's. It is passed as a parameter
 * rather than written into the SQL text, which keeps this module's statements parameterised in
 * the way lib/db.ts requires and puts the zone in exactly one place.
 */
export const BANGKOK = "Asia/Bangkok";

/** One row per product per Bangkok day. The slug is validated by the caller against the catalogue. */
export async function recordProductView(slug: string): Promise<void> {
  if (!isConfigured()) return;
  await query(
    `insert into product_views (product_slug, day, views)
     values ($1, (now() at time zone $2::text)::date, 1)
     on conflict (product_slug, day) do update set views = product_views.views + 1`,
    [slug, BANGKOK],
  );
}

/** One row per surface per Bangkok day, from a fixed list of surfaces. */
export async function recordSurfaceView(surface: string): Promise<void> {
  if (!isConfigured()) return;
  await query(
    `insert into page_views (surface, day, views)
     values ($1, (now() at time zone $2::text)::date, 1)
     on conflict (surface, day) do update set views = page_views.views + 1`,
    [surface, BANGKOK],
  );
}

/**
 * One row per normalised query per Bangkok day.
 *
 * `results` is overwritten rather than left at its first value: it is a property of the
 * catalogue on the day, not of the search, so the latest reading is the truthful one — and a
 * query that stops returning nothing because the shop started stocking it should stop showing
 * up in the zero-result panel.
 */
export async function recordSearch(text: string, results: number): Promise<void> {
  if (!isConfigured()) return;
  await query(
    `insert into search_queries (query, day, searches, results)
     values ($1, (now() at time zone $2::text)::date, 1, $3)
     on conflict (query, day)
     do update set searches = search_queries.searches + 1, results = excluded.results`,
    [text, BANGKOK, results],
  );
}
