import "server-only";
import { BANGKOK } from "@/lib/analytics";
import { query, queryOne } from "@/lib/db";

/*
  Every figure on /admin, read as an aggregate.

  /account counts by fetching a person's rows and taking `.length`, which is right for a dozen
  saved items and wrong for a whole site — so nothing here returns a list in order to count it.
  `count(*)::text` then Number(): `pg` hands bigint back as a string, because a bigint does not
  fit a JS number, and every count on this site comfortably does.

  Nothing is cached. Every /admin route is request-time anyway because the gate reads the cookie,
  and a dashboard showing yesterday's numbers is worse than no dashboard.

  Day buckets are Bangkok's, matching lib/analytics.ts. The zone is a parameter, and it appears
  more than once in most of these statements, so each use carries an explicit ::text — Postgres
  refuses to deduce a type for a placeholder used twice, the same trap the lockout update in
  lib/accounts.ts documents.
*/

const num = (value: string | number | null) => Number(value ?? 0);

export type Overview = {
  accounts: number;
  accountsToday: number;
  reviews: number;
  saved: number;
  liveSessions: number;
  productViewsToday: number;
  pageViewsToday: number;
  searchesToday: number;
  zeroResultToday: number;
};

/** The tile row, in one round trip. */
export async function overview(): Promise<Overview> {
  const row = await queryOne<Record<string, string>>(
    `select
       (select count(*) from users)::text as accounts,
       (select count(*) from users
         where (created_at at time zone $1::text)::date = (now() at time zone $1::text)::date
       )::text as accounts_today,
       (select count(*) from reviews)::text as reviews,
       (select count(*) from saved_items)::text as saved,
       (select count(*) from sessions where expires_at > now())::text as live_sessions,
       (select coalesce(sum(views), 0) from product_views
         where day = (now() at time zone $1::text)::date)::text as product_views_today,
       (select coalesce(sum(views), 0) from page_views
         where day = (now() at time zone $1::text)::date)::text as page_views_today,
       (select coalesce(sum(searches), 0) from search_queries
         where day = (now() at time zone $1::text)::date)::text as searches_today,
       (select coalesce(sum(searches), 0) from search_queries
         where day = (now() at time zone $1::text)::date and results = 0)::text as zero_result_today`,
    [BANGKOK],
  );

  return {
    accounts: num(row?.accounts ?? 0),
    accountsToday: num(row?.accounts_today ?? 0),
    reviews: num(row?.reviews ?? 0),
    saved: num(row?.saved ?? 0),
    liveSessions: num(row?.live_sessions ?? 0),
    productViewsToday: num(row?.product_views_today ?? 0),
    pageViewsToday: num(row?.page_views_today ?? 0),
    searchesToday: num(row?.searches_today ?? 0),
    zeroResultToday: num(row?.zero_result_today ?? 0),
  };
}

export type DayPoint = { day: string; value: number };

/**
 * Signups per day, zero-filled with generate_series over Bangkok dates.
 *
 * The zero-fill matters for the chart rather than the data: without it a quiet day is a missing
 * bar, and a missing bar silently narrows the axis so the week reads busier than it was.
 */
export async function signupsByDay(days = 30): Promise<DayPoint[]> {
  const rows = await query<{ day: string; n: string }>(
    `with span as (
       select generate_series(
         (now() at time zone $1::text)::date - ($2::int - 1),
         (now() at time zone $1::text)::date,
         interval '1 day'
       )::date as day
     )
     select s.day::text as day, count(u.id)::text as n
     from span s
     left join users u on (u.created_at at time zone $1::text)::date = s.day
     group by s.day
     order by s.day`,
    [BANGKOK, days],
  );

  return rows.map((row) => ({ day: row.day, value: num(row.n) }));
}

/** Product views and surface views per day, zero-filled the same way. */
export async function viewsByDay(days = 30): Promise<{ products: DayPoint[]; pages: DayPoint[] }> {
  const rows = await query<{ day: string; products: string; pages: string }>(
    `with span as (
       select generate_series(
         (now() at time zone $1::text)::date - ($2::int - 1),
         (now() at time zone $1::text)::date,
         interval '1 day'
       )::date as day
     )
     select s.day::text as day,
            coalesce((select sum(views) from product_views p where p.day = s.day), 0)::text as products,
            coalesce((select sum(views) from page_views g where g.day = s.day), 0)::text as pages
     from span s
     order by s.day`,
    [BANGKOK, days],
  );

  return {
    products: rows.map((row) => ({ day: row.day, value: num(row.products) })),
    pages: rows.map((row) => ({ day: row.day, value: num(row.pages) })),
  };
}

export type ProviderSplit = { password: number; google: number; facebook: number; providerOnly: number };

/**
 * How people get in. The rows overlap on purpose — an account can have a password and a linked
 * provider — so the panel labels them as counts, never as slices of a whole.
 */
export async function providerSplit(): Promise<ProviderSplit> {
  const row = await queryOne<Record<string, string>>(
    `select
       (select count(*) from users where password_hash is not null)::text as password,
       (select count(distinct user_id) from identities where provider = 'google')::text as google,
       (select count(distinct user_id) from identities where provider = 'facebook')::text as facebook,
       (select count(*) from users where password_hash is null)::text as provider_only`,
  );

  return {
    password: num(row?.password ?? 0),
    google: num(row?.google ?? 0),
    facebook: num(row?.facebook ?? 0),
    providerOnly: num(row?.provider_only ?? 0),
  };
}

export const PAGE_SIZE = 25;

/** `<iso>|<uuid>`, the sort key of the last row on the page — lib/reviews.ts's cursor, reused. */
export type Page<T> = { rows: T[]; cursor: string | null };

function decodeCursor(cursor: string | null | undefined): { at: string; id: string } | null {
  if (!cursor) return null;
  const [at, id] = cursor.split("|");
  const valid = at && id && !Number.isNaN(Date.parse(at)) && /^[0-9a-f-]{36}$/i.test(id);
  return valid ? { at, id } : null;
}

function paginate<T extends { createdAt: string; id: string }>(rows: T[]): Page<T> {
  const page = rows.slice(0, PAGE_SIZE);
  const last = page[page.length - 1];
  // The over-fetched row is the whole answer to "is there another page", with no count query.
  return { rows: page, cursor: rows.length > PAGE_SIZE && last ? `${last.createdAt}|${last.id}` : null };
}

export type AdminAccount = {
  id: string;
  displayName: string;
  /** The one surface on this site that shows an address, which is why the gate is tight. */
  email: string | null;
  createdAt: string;
  hasPassword: boolean;
  providers: string[];
  reviews: number;
  saved: number;
};

/** Every account, newest first. Keyset on (created_at, id) so a signup mid-read cannot repeat a row. */
export async function recentAccounts(cursor?: string | null): Promise<Page<AdminAccount>> {
  const after = decodeCursor(cursor);

  const rows = await query<{
    id: string;
    display_name: string;
    email: string | null;
    created_at: Date;
    has_password: boolean;
    providers: string | null;
    reviews: string;
    saved: string;
  }>(
    `select u.id, u.display_name, u.email, u.created_at,
            u.password_hash is not null as has_password,
            (select string_agg(i.provider, ',' order by i.provider)
               from identities i where i.user_id = u.id) as providers,
            (select count(*) from reviews r where r.user_id = u.id)::text as reviews,
            (select count(*) from saved_items s where s.user_id = u.id)::text as saved
     from users u
     where ($1::timestamptz is null or (u.created_at, u.id) < ($1::timestamptz, $2::uuid))
     order by u.created_at desc, u.id desc
     limit $3`,
    [after?.at ?? null, after?.id ?? null, PAGE_SIZE + 1],
  );

  return paginate(
    rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      email: row.email,
      createdAt: row.created_at.toISOString(),
      hasPassword: row.has_password,
      providers: row.providers ? row.providers.split(",") : [],
      reviews: num(row.reviews),
      saved: num(row.saved),
    })),
  );
}

export type AdminReview = {
  id: string;
  slug: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  createdAt: string;
  edited: boolean;
};

/** Every review on the site, newest first, same keyset. */
export async function recentReviews(cursor?: string | null): Promise<Page<AdminReview>> {
  const after = decodeCursor(cursor);

  const rows = await query<{
    id: string;
    product_slug: string;
    rating: number;
    title: string | null;
    body: string;
    author: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `select r.id, r.product_slug, r.rating, r.title, r.body,
            u.display_name as author, r.created_at, r.updated_at
     from reviews r join users u on u.id = r.user_id
     where ($1::timestamptz is null or (r.created_at, r.id) < ($1::timestamptz, $2::uuid))
     order by r.created_at desc, r.id desc
     limit $3`,
    [after?.at ?? null, after?.id ?? null, PAGE_SIZE + 1],
  );

  return paginate(
    rows.map((row) => ({
      id: row.id,
      slug: row.product_slug,
      rating: row.rating,
      title: row.title,
      body: row.body,
      author: row.author,
      createdAt: row.created_at.toISOString(),
      // Two seconds of slack, matching lib/reviews.ts: the insert sets both from one now().
      edited: row.updated_at.getTime() - row.created_at.getTime() > 2000,
    })),
  );
}

/** A slug and a number: what every ranking panel on /admin/products is made of. */
export type SlugCount = { slug: string; count: number };

/**
 * Most reviewed here, with the average of our rows.
 *
 * The average is ours alone. `product.rating` is the source listing's aggregate and the two are
 * never mixed into one figure — the honesty rule the reviews block exists to hold, applied to
 * the dashboard.
 */
export async function topReviewedProducts(limit = 10): Promise<(SlugCount & { average: number })[]> {
  const rows = await query<{ product_slug: string; n: string; average: number }>(
    `select product_slug, count(*)::text as n, avg(rating)::float8 as average
     from reviews
     group by product_slug
     order by count(*) desc, product_slug
     limit $1`,
    [limit],
  );

  return rows.map((row) => ({ slug: row.product_slug, count: num(row.n), average: row.average }));
}

/** Most saved — the closest thing this site has to a wishlist signal. */
export async function topSavedProducts(limit = 10): Promise<SlugCount[]> {
  const rows = await query<{ product_slug: string; n: string }>(
    `select product_slug, count(*)::text as n
     from saved_items
     group by product_slug
     order by count(*) desc, product_slug
     limit $1`,
    [limit],
  );

  return rows.map((row) => ({ slug: row.product_slug, count: num(row.n) }));
}

/** Most opened over a window of Bangkok days, `days` inclusive of today. */
export async function topViewedProducts(days = 30, limit = 10): Promise<SlugCount[]> {
  const rows = await query<{ product_slug: string; n: string }>(
    `select product_slug, sum(views)::text as n
     from product_views
     where day > (now() at time zone $1::text)::date - $2::int
     group by product_slug
     order by sum(views) desc, product_slug
     limit $3`,
    [BANGKOK, days, limit],
  );

  return rows.map((row) => ({ slug: row.product_slug, count: num(row.n) }));
}

/** Views per surface over the window. Eight surfaces at most, so no limit is needed. */
export async function surfaceViews(days = 30): Promise<{ surface: string; count: number }[]> {
  const rows = await query<{ surface: string; n: string }>(
    `select surface, sum(views)::text as n
     from page_views
     where day > (now() at time zone $1::text)::date - $2::int
     group by surface
     order by sum(views) desc, surface`,
    [BANGKOK, days],
  );

  return rows.map((row) => ({ surface: row.surface, count: num(row.n) }));
}

export type SearchRow = { query: string; count: number; results: number };

/** What people search for. `results` is the most recent day's reading, not a sum. */
export async function topSearches(days = 30, limit = 25): Promise<SearchRow[]> {
  const rows = await query<{ query: string; n: string; results: string }>(
    `select query, sum(searches)::text as n,
            (array_agg(results order by day desc))[1]::text as results
     from search_queries
     where day > (now() at time zone $1::text)::date - $2::int
     group by query
     order by sum(searches) desc, query
     limit $3`,
    [BANGKOK, days, limit],
  );

  return rows.map((row) => ({ query: row.query, count: num(row.n), results: num(row.results) }));
}

/**
 * Searches that came back with nothing — the panel worth building the rest of this for.
 *
 * `having` on the most recent reading rather than `where results = 0`, so a query that returned
 * nothing last week and returns something today drops out of the list instead of standing as a
 * permanent accusation about stock that has since arrived.
 */
export async function zeroResultSearches(days = 30, limit = 25): Promise<SlugCount[]> {
  const rows = await query<{ query: string; n: string }>(
    `select query, sum(searches)::text as n
     from search_queries
     where day > (now() at time zone $1::text)::date - $2::int
     group by query
     having (array_agg(results order by day desc))[1] = 0
     order by sum(searches) desc, query
     limit $3`,
    [BANGKOK, days, limit],
  );

  return rows.map((row) => ({ slug: row.query, count: num(row.n) }));
}
