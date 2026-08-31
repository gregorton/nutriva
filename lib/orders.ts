import "server-only";
import { isConfigured, query, queryOne, tx } from "@/lib/db";

/*
  Orders. The one place in this codebase that writes a commercial record.

  Nothing here trusts a price: `placeOrder` takes lines the caller has already resolved through
  `getProduct()` and totals it has already recomputed, and app/actions/checkout.ts is the only
  caller. Line prices are written as columns, not looked up later — see the note in
  lib/schema/005_orders.sql for why an order cannot depend on the catalogue.
*/

export type OrderAddress = {
  line: string;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
};

export type NewOrderItem = {
  slug: string;
  title: string;
  brand: string;
  unitPrice: number;
  qty: number;
};

export type NewOrder = {
  userId: string | null;
  email: string;
  name: string;
  phone: string;
  address: OrderAddress;
  deliveryMethod: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: NewOrderItem[];
};

export type OrderItem = NewOrderItem;

export type Order = {
  orderNo: string;
  email: string;
  name: string;
  phone: string;
  address: OrderAddress;
  deliveryMethod: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

/** SWA-26-0001. The counter is a sequence, so two orders in the same second cannot collide. */
async function nextOrderNo(client: { query: (text: string, params?: unknown[]) => Promise<{ rows: { n: string }[] }> }) {
  const { rows } = await client.query("select nextval('order_no_seq')::text as n");
  const year = new Date().getUTCFullYear() % 100;
  return `SWA-${String(year).padStart(2, "0")}-${rows[0].n.padStart(4, "0")}`;
}

/**
 * Writes the order and its lines in one transaction, and returns the order number the shopper is
 * shown. Throws when the database is unconfigured: an order that silently did not save is worse
 * than an error page.
 */
export async function placeOrder(order: NewOrder): Promise<string> {
  if (!isConfigured()) throw new Error("orders: DATABASE_URL is not set");

  return tx(async (client) => {
    const orderNo = await nextOrderNo(client);

    const inserted = await client.query<{ id: string }>(
      `insert into orders
         (order_no, user_id, email, name, phone, address,
          delivery_method, payment_method, subtotal, delivery_fee, total)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
       returning id`,
      [
        orderNo,
        order.userId,
        order.email,
        order.name,
        order.phone,
        JSON.stringify(order.address),
        order.deliveryMethod,
        order.paymentMethod,
        order.subtotal,
        order.deliveryFee,
        order.total,
      ],
    );

    const orderId = inserted.rows[0].id;

    for (const item of order.items) {
      await client.query(
        `insert into order_items (order_id, product_slug, title, brand, unit_price, qty)
         values ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.slug, item.title, item.brand, item.unitPrice, item.qty],
      );
    }

    return orderNo;
  });
}

type OrderRow = {
  id: string;
  order_no: string;
  email: string;
  name: string;
  phone: string;
  address: OrderAddress;
  delivery_method: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: Date;
};

type ItemRow = {
  product_slug: string;
  title: string;
  brand: string;
  unit_price: number;
  qty: number;
};

async function itemsFor(orderId: string): Promise<OrderItem[]> {
  const rows = await query<ItemRow>(
    `select product_slug, title, brand, unit_price, qty
       from order_items where order_id = $1 order by id`,
    [orderId],
  );
  return rows.map((row) => ({
    slug: row.product_slug,
    title: row.title,
    brand: row.brand,
    unitPrice: row.unit_price,
    qty: row.qty,
  }));
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    orderNo: row.order_no,
    email: row.email,
    name: row.name,
    phone: row.phone,
    address: row.address,
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    items,
  };
}

const SELECT = `select id, order_no, email, name, phone, address, delivery_method,
                       payment_method, subtotal, delivery_fee, total, status, created_at
                  from orders`;

/**
 * One order by its number. The confirmation page is the only way a guest reaches their own order,
 * so this deliberately does not require a user — the order number is the credential, which is why
 * it comes off a sequence rather than being guessable from a count of anything public.
 */
export async function orderByNo(orderNo: string): Promise<Order | null> {
  if (!isConfigured()) return null;
  const row = await queryOne<OrderRow>(`${SELECT} where order_no = $1`, [orderNo]);
  return row ? toOrder(row, await itemsFor(row.id)) : null;
}

/** The same lookup, but only if the order belongs to this account. Used by /account/orders. */
export async function orderForUser(userId: string, orderNo: string): Promise<Order | null> {
  if (!isConfigured()) return null;
  const row = await queryOne<OrderRow>(`${SELECT} where order_no = $1 and user_id = $2`, [
    orderNo,
    userId,
  ]);
  return row ? toOrder(row, await itemsFor(row.id)) : null;
}

export type OrderSummary = {
  orderNo: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  /** First few product slugs, for the thumbnails on the list. */
  slugs: string[];
};

type SummaryRow = {
  order_no: string;
  total: number;
  status: string;
  created_at: Date;
  item_count: string;
  slugs: string[];
};

const SUMMARY = `select o.order_no, o.total, o.status, o.created_at,
                        coalesce(sum(i.qty), 0)::text as item_count,
                        coalesce(array_agg(i.product_slug order by i.id), '{}') as slugs
                   from orders o left join order_items i on i.order_id = o.id`;

function toSummary(row: SummaryRow): OrderSummary {
  return {
    orderNo: row.order_no,
    total: row.total,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    itemCount: Number(row.item_count),
    slugs: row.slugs.slice(0, 4),
  };
}

/** Every order on an account, newest first. */
export async function ordersForUser(userId: string): Promise<OrderSummary[]> {
  if (!isConfigured()) return [];
  const rows = await query<SummaryRow>(
    `${SUMMARY} where o.user_id = $1 group by o.id order by o.created_at desc`,
    [userId],
  );
  return rows.map(toSummary);
}

/** Newest orders across the shop, for the read-only dashboard. */
export async function recentOrders(limit = 50): Promise<OrderSummary[]> {
  if (!isConfigured()) return [];
  const rows = await query<SummaryRow>(
    `${SUMMARY} group by o.id order by o.created_at desc limit $1`,
    [limit],
  );
  return rows.map(toSummary);
}

export type OrderTotals = { orders: number; revenue: number; items: number; guests: number };

/** Counters for the dashboard. Revenue is what was ordered, not what has been paid. */
export async function orderTotals(): Promise<OrderTotals> {
  if (!isConfigured()) return { orders: 0, revenue: 0, items: 0, guests: 0 };
  const row = await queryOne<{ orders: string; revenue: string; items: string; guests: string }>(
    `select count(*)::text as orders,
            coalesce(sum(total), 0)::text as revenue,
            coalesce((select sum(qty) from order_items), 0)::text as items,
            count(*) filter (where user_id is null)::text as guests
       from orders`,
  );
  return {
    orders: Number(row?.orders ?? 0),
    revenue: Number(row?.revenue ?? 0),
    items: Number(row?.items ?? 0),
    guests: Number(row?.guests ?? 0),
  };
}
