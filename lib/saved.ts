import "server-only";
import { query } from "@/lib/db";

/*
  Saved items. A join table and nothing else: what a saved slug means is resolved against the
  catalogue at read time, so a product retired by a catalogue refresh disappears from the list
  instead of 404ing from it.
*/

export function savedSlugs(userId: string): Promise<string[]> {
  return query<{ product_slug: string }>(
    "select product_slug from saved_items where user_id = $1 order by created_at desc",
    [userId],
  ).then((rows) => rows.map((row) => row.product_slug));
}

/** Returns the state the slug ended up in, which is what the button needs back. */
export async function toggleSaved(userId: string, slug: string): Promise<boolean> {
  const inserted = await query<{ product_slug: string }>(
    `insert into saved_items (user_id, product_slug) values ($1, $2)
     on conflict (user_id, product_slug) do nothing
     returning product_slug`,
    [userId, slug],
  );

  if (inserted.length > 0) return true;

  await query("delete from saved_items where user_id = $1 and product_slug = $2", [userId, slug]);
  return false;
}
