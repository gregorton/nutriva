-- 005_orders — what somebody bought, and where it goes.
--
-- Two decisions worth knowing before changing anything here.
--
-- 1. `order_items` snapshots the product. Title, brand and unit price are columns on the row, not
--    a join back to a catalogue that does not live in this database at all. The catalogue is a
--    generated JSON module rebuilt from a scrape, so a slug can be retired and a price will move
--    with the exchange rate. An order is a record of a transaction and has to keep reading
--    correctly years after the product page stops existing. `product_slug` is kept so the item can
--    link to the page while it is still there, and it is deliberately not a foreign key.
--
-- 2. Money is stored in whole baht as integers. Every price in this storefront is a whole baht by
--    the time it leaves lib/fx.ts, and integer arithmetic cannot drift the way a float can.
--
-- `user_id` is nullable: guests check out. A guest order is reachable only through its own
-- confirmation URL; a signed-in order also appears under /account/orders.

create table if not exists orders (
  id              uuid        primary key default gen_random_uuid(),
  -- Human-readable and quoted in email: SWA-26-0001. Unique so it can address an order on its own.
  order_no        text        not null unique,
  user_id         uuid        references users (id) on delete set null,
  email           text        not null,
  name            text        not null,
  phone           text        not null,
  -- The delivery address as typed: line, subdistrict, district, province, postcode. One column
  -- because it is written once and read whole, and Thai address shape is not worth five columns.
  address         jsonb       not null,
  delivery_method text        not null,
  payment_method  text        not null,
  subtotal        integer     not null,
  delivery_fee    integer     not null,
  total           integer     not null,
  -- 'placed' on insert. There is no fulfilment system behind this yet, so nothing advances it.
  status          text        not null default 'placed',
  created_at      timestamptz not null default now()
);

create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_created_idx on orders (created_at desc);

create table if not exists order_items (
  id           uuid      primary key default gen_random_uuid(),
  order_id     uuid      not null references orders (id) on delete cascade,
  product_slug text      not null,
  -- Snapshotted, per the note above.
  title        text      not null,
  brand        text      not null,
  unit_price   integer   not null,
  qty          integer   not null check (qty > 0)
);

create index if not exists order_items_order_idx on order_items (order_id);

-- Order numbers come from a sequence rather than a count, so two orders placed in the same second
-- cannot both read the same number and both write it.
create sequence if not exists order_no_seq start with 1;
