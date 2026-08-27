-- 001_init — accounts, sessions, reviews, saved items.
--
-- `product_slug` columns are plain text, not foreign keys: the catalogue is a generated JSON
-- module (lib/catalog.generated.json), not a table, and a refresh can retire a slug. The read
-- layer resolves each slug through getProduct() and drops what no longer exists, the same way
-- components/cart/cart-context.tsx already handles a stale localStorage cart.

create extension if not exists "pgcrypto";

create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  email          text        not null unique,
  password_hash  text        not null,
  display_name   text        not null,
  -- Sign-in throttle. A public credentials form needs one; see lib/accounts.ts.
  failed_attempts integer    not null default 0,
  locked_until   timestamptz,
  created_at     timestamptz not null default now()
);

-- Sessions are opaque: the cookie carries a random 32-byte token, the table stores only its
-- SHA-256. A leaked database row cannot be replayed as a cookie.
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references users (id) on delete cascade,
  token_hash  bytea       not null unique,
  user_agent  text,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- One review per person per product: writing again edits the one you already left.
create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  product_slug text        not null,
  user_id      uuid        not null references users (id) on delete cascade,
  rating       smallint    not null check (rating between 1 and 5),
  title        text,
  body         text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_slug, user_id)
);

create index if not exists reviews_product_slug_idx on reviews (product_slug, created_at desc);

create table if not exists saved_items (
  user_id      uuid        not null references users (id) on delete cascade,
  product_slug text        not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, product_slug)
);
