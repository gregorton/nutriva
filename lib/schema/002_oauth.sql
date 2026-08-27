-- 002_oauth — signing in with Google or Facebook.
--
-- An account can now exist with no password at all, so `password_hash` becomes nullable. The
-- password path is unchanged: lib/accounts.ts still refuses to authenticate a row without one.
--
-- `email` becomes nullable for the same reason. Somebody who joined Facebook with a phone number
-- has no address to give us, and inventing a placeholder would put a fake address in the column
-- the account is identified by. Postgres treats NULLs as distinct, so the unique constraint still
-- does its job for every account that does have one, and a row with no email simply cannot use
-- the password path — `authenticate()` matches on the address.

alter table users alter column password_hash drop not null;
alter table users alter column email drop not null;

-- One row per (provider, account-at-that-provider). The primary key is what makes a repeat
-- sign-in a lookup rather than a new account, and `on delete cascade` means deleting a Nutriva
-- account takes its provider links with it.
create table if not exists identities (
  provider         text        not null,
  provider_user_id text        not null,
  user_id          uuid        not null references users (id) on delete cascade,
  -- The address the provider gave us, kept for support questions. `users.email` stays the one
  -- the account is identified by.
  email            text,
  created_at       timestamptz not null default now(),
  primary key (provider, provider_user_id)
);

create index if not exists identities_user_id_idx on identities (user_id);
