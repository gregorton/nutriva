-- 006_profile — the personal details an account can hold, and its address book.
--
-- Nothing here is required. An account has always been an address and a display name, and it stays
-- usable with every column below left null: these exist so somebody can be reached about an order
-- and can check out without retyping where they live.
--
-- `gender` is deliberately free text with no check constraint. The list the form offers is UI copy,
-- not a data invariant, and every write goes through one Server Action that validates against it —
-- a constraint here would mean a migration to add an option.

alter table users add column if not exists phone    text;
alter table users add column if not exists birthday date;
alter table users add column if not exists gender   text;

-- The address book. Deliberately not a foreign key from `orders`: an order snapshots the address it
-- shipped to as jsonb (see 005_orders.sql), so editing or deleting an entry here can never rewrite
-- where a past parcel went.
create table if not exists addresses (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references users (id) on delete cascade,
  -- "Home", "Office". Optional, and the only field on the row that is not part of an address.
  label       text,
  name        text        not null,
  phone       text        not null,
  line        text        not null,
  subdistrict text        not null,
  district    text        not null,
  province    text        not null,
  postcode    text        not null,
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists addresses_user_idx on addresses (user_id, created_at desc);

-- One default per account, held by the database rather than by the code that writes it. A partial
-- unique index is the whole rule: rows with is_default false are not indexed at all, so an account
-- can hold many addresses and at most one default. lib/addresses.ts clears the old one in the same
-- transaction, and this is what makes that not a matter of trust.
create unique index if not exists addresses_one_default on addresses (user_id) where is_default;
