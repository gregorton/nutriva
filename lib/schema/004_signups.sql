-- 004_signups — the two email captures on the storefront, in one table.
--
-- The footer's restock reminder and the out-of-stock "email me when it's back" form are the same
-- record with and without a product, so they share a table rather than duplicating one. A null
-- `product_slug` is the general list; a set one is a request about that product.
--
-- `product_slug` is plain text and not a foreign key, for the reason 001_init gives: the catalogue
-- is a generated JSON module and a refresh can retire a slug.
--
-- Nothing here sends mail — the site has no mail transport at all. This records who asked, so that
-- whoever runs the shop can act on it. Nobody is told they will be emailed by a system that could
-- not email them; the confirmation says the request was noted.

create table if not exists signups (
  id           bigserial   primary key,
  email        text        not null,
  product_slug text,
  -- Which form it came from: 'restock' or 'footer'. A fixed set validated by the server action.
  source       text        not null,
  created_at   timestamptz not null default now()
);

-- One row per address per product, so a second press is not a second row. Postgres treats nulls as
-- distinct in a unique index, so the general list needs its own partial index to be idempotent too.
create unique index if not exists signups_email_product_idx
  on signups (email, product_slug)
  where product_slug is not null;

create unique index if not exists signups_email_general_idx
  on signups (email)
  where product_slug is null;

create index if not exists signups_created_idx on signups (created_at desc);
