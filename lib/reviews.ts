import "server-only";
import { unstable_cache } from "next/cache";
import { isConfigured, query, queryOne } from "@/lib/db";
import type { ReviewDraft } from "@/lib/validate";

/*
  Reviews written on this site, which is a different thing from the `rating` and `reviews` fields
  on a Product. Those are the source listing's aggregate, harvested; these are ours. They are
  never averaged together — see components/pdp/review-summary.tsx for how both are shown.

  Reads go through `unstable_cache` tagged `reviews:<slug>`, which is what lets /p/[slug] stay
  one of 470 prerendered pages: anonymous traffic is served the built HTML and never reaches
  Postgres, and posting a review calls revalidateTag() to rebuild that one page.

  Pagination is keyset, on (created_at, id) rather than an offset, so a review posted while
  someone is reading page one cannot make page two repeat a row.
*/

export const PAGE_SIZE = 10;

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  /** Display name of whoever wrote it. Reviews are attributed, never anonymous. */
  author: string;
  createdAt: string;
  edited: boolean;
};

export type ReviewSlice = { reviews: Review[]; cursor: string | null };

export type ReviewSummary = {
  count: number;
  /** null when nobody has reviewed this product yet — no bars, no figure, per the null rule. */
  average: number | null;
  buckets: { stars: number; count: number; percent: number }[];
};

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  created_at: Date;
  updated_at: Date;
};

const TAG = (slug: string) => `reviews:${slug}`;

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    author: row.author,
    createdAt: row.created_at.toISOString(),
    // Two seconds of slack: the insert sets both timestamps from the same now().
    edited: row.updated_at.getTime() - row.created_at.getTime() > 2000,
  };
}

/** `<iso>|<uuid>` — the sort key of the last row returned, opaque to the caller. */
function encodeCursor(review: Review): string {
  return `${review.createdAt}|${review.id}`;
}

function decodeCursor(cursor: string | null): { at: string; id: string } | null {
  if (!cursor) return null;
  const [at, id] = cursor.split("|");
  const valid = at && id && !Number.isNaN(Date.parse(at)) && /^[0-9a-f-]{36}$/i.test(id);
  return valid ? { at, id } : null;
}

async function readSlice(slug: string, cursor: string | null): Promise<ReviewSlice> {
  const after = decodeCursor(cursor);

  // One extra row tells us whether a further page exists without a second count query.
  const rows = await query<ReviewRow>(
    `select r.id, r.rating, r.title, r.body, u.display_name as author, r.created_at, r.updated_at
     from reviews r join users u on u.id = r.user_id
     where r.product_slug = $1
       and ($2::timestamptz is null or (r.created_at, r.id) < ($2::timestamptz, $3::uuid))
     order by r.created_at desc, r.id desc
     limit $4`,
    [slug, after?.at ?? null, after?.id ?? null, PAGE_SIZE + 1],
  );

  const reviews = rows.slice(0, PAGE_SIZE).map(toReview);
  const hasMore = rows.length > PAGE_SIZE;
  return { reviews, cursor: hasMore && reviews.length ? encodeCursor(reviews[reviews.length - 1]) : null };
}

async function readSummary(slug: string): Promise<ReviewSummary> {
  const rows = await query<{ rating: number; n: string }>(
    "select rating, count(*)::text as n from reviews where product_slug = $1 group by rating",
    [slug],
  );

  const counts = new Map(rows.map((row) => [row.rating, Number(row.n)]));
  const count = [...counts.values()].reduce((sum, n) => sum + n, 0);
  if (count === 0) return { count: 0, average: null, buckets: [] };

  const total = [...counts.entries()].reduce((sum, [stars, n]) => sum + stars * n, 0);
  const buckets = [5, 4, 3, 2, 1].map((stars) => {
    const n = counts.get(stars) ?? 0;
    return { stars, count: n, percent: Math.round((n / count) * 100) };
  });

  return { count, average: total / count, buckets };
}

export const EMPTY_REVIEWS: { summary: ReviewSummary; slice: ReviewSlice } = {
  summary: { count: 0, average: null, buckets: [] },
  slice: { reviews: [], cursor: null },
};

/**
 * First page plus the distribution, cached together — the PDP always needs both.
 *
 * The catch is outside the cache on purpose. `next build` prerenders 470 product pages, and if
 * the database is unreachable during one of them the right outcome is a page with no reviews on
 * it, not a failed build — but an empty result must not be what gets stored, or the page would
 * keep serving it until something revalidated the tag.
 */
export async function productReviews(
  slug: string,
): Promise<{ summary: ReviewSummary; slice: ReviewSlice }> {
  if (!isConfigured()) return EMPTY_REVIEWS;

  try {
    return await unstable_cache(
      async () => ({ summary: await readSummary(slug), slice: await readSlice(slug, null) }),
      ["reviews", slug],
      // Tagged for on-demand revalidation when a review is written; the hourly figure is only a
      // backstop for a revalidation that never arrived.
      { tags: [TAG(slug)], revalidate: 3600 },
    )();
  } catch (error) {
    console.error(`Reviews unavailable for ${slug}:`, error);
    return EMPTY_REVIEWS;
  }
}

/** Later pages, for the Load more button. Cached per cursor under the same tag. */
export function moreReviews(slug: string, cursor: string): Promise<ReviewSlice> {
  return unstable_cache(() => readSlice(slug, cursor), ["reviews", slug, cursor], {
    tags: [TAG(slug)],
    revalidate: 3600,
  })();
}

/**
 * The signed-in reader's own review of this product, if any. Deliberately uncached: it is
 * per-user, and it is read inside a component that is already request-time.
 */
export function myReview(slug: string, userId: string): Promise<Review | null> {
  return queryOne<ReviewRow>(
    `select r.id, r.rating, r.title, r.body, u.display_name as author, r.created_at, r.updated_at
     from reviews r join users u on u.id = r.user_id
     where r.product_slug = $1 and r.user_id = $2`,
    [slug, userId],
  ).then((row) => (row ? toReview(row) : null));
}

/** Everything one account has written, newest first, for /account/reviews. */
export function reviewsByUser(userId: string): Promise<(Review & { slug: string })[]> {
  return query<ReviewRow & { product_slug: string }>(
    `select r.id, r.product_slug, r.rating, r.title, r.body, u.display_name as author,
            r.created_at, r.updated_at
     from reviews r join users u on u.id = r.user_id
     where r.user_id = $1
     order by r.updated_at desc`,
    [userId],
  ).then((rows) => rows.map((row) => ({ ...toReview(row), slug: row.product_slug })));
}

/** Writing again edits what you already left — one review per person per product. */
export async function upsertReview(slug: string, userId: string, draft: ReviewDraft): Promise<void> {
  await query(
    `insert into reviews (product_slug, user_id, rating, title, body)
     values ($1, $2, $3, $4, $5)
     on conflict (product_slug, user_id)
     do update set rating = excluded.rating, title = excluded.title,
                   body = excluded.body, updated_at = now()`,
    [slug, userId, draft.rating, draft.title, draft.body],
  );
}

/** Scoped to the owner in the statement itself, so it cannot delete someone else's row. */
export async function deleteReview(slug: string, userId: string): Promise<void> {
  await query("delete from reviews where product_slug = $1 and user_id = $2", [slug, userId]);
}
