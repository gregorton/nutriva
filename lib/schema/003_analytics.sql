-- 003_analytics — anonymous, aggregated counters behind /admin.
--
-- Three tables, each a (thing, day) primary key over an integer incremented in place. There is
-- no visitor id, no cookie, no IP and no per-event row anywhere: these tables can answer "how
-- many people opened this product yesterday" and cannot answer "what did this person do". That
-- is deliberate. It keeps the counters to a few thousand integer rows a month, and it keeps the
-- site clear of the obligations a behavioural log would create.
--
-- `day` is always Bangkok's date, never `current_date`. The database runs in GMT, so for the
-- first seven hours of every Thai day the two disagree — the busiest part of a Thai evening
-- would be filed under the previous day. Every writer passes the zone as a parameter:
--
--   (now() at time zone $n::text)::date   with 'Asia/Bangkok'
--
-- `product_slug` is plain text and not a foreign key, for the reason 001_init gives: the
-- catalogue is a generated JSON module and a refresh can retire a slug. A counter for a product
-- that no longer exists is history rather than a broken row, and the read layer drops it.

create table if not exists product_views (
  product_slug text    not null,
  day          date    not null,
  views        integer not null default 0,
  primary key (product_slug, day)
);

create index if not exists product_views_day_idx on product_views (day desc);

-- One row per surface per day. The set of surfaces is a hardcoded list in app/api/track/route.ts,
-- so this table has a fixed width no caller can widen.
create table if not exists page_views (
  surface text    not null,
  day     date    not null,
  views   integer not null default 0,
  primary key (surface, day)
);

create index if not exists page_views_day_idx on page_views (day desc);

-- `results` is how many products the query actually matched, recomputed on the server on every
-- write and never taken from the request. A query recorded here with 0 is the most actionable
-- figure on the dashboard: somebody looked for something this shop does not stock.
create table if not exists search_queries (
  query    text    not null,
  day      date    not null,
  searches integer not null default 0,
  results  integer not null default 0,
  primary key (query, day)
);

create index if not exists search_queries_day_idx on search_queries (day desc);
