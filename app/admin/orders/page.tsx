import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { getProduct } from "@/lib/catalog";
import { price } from "@/lib/format";
import { orderTotals, recentOrders } from "@/lib/orders";
import { StatTile } from "@/components/admin/stat-tile";
import { When } from "@/components/admin/when";

export const metadata: Metadata = { title: "Orders" };

/*
  Every order, newest first. Read-only like the rest of this console: no action, no form, no
  mutation, so a leaked admin session cannot alter or cancel anything.

  Revenue is what was ordered, not what has cleared. Nothing behind this site takes payment, so a
  paid figure would be a guess.
*/
export default async function AdminOrdersPage() {
  await requireAdmin("/admin/orders");

  const [totals, orders] = await Promise.all([orderTotals(), recentOrders(60)]);

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="orders" value={totals.orders} />
        <StatTile
          label="ordered value"
          value={totals.revenue}
          display={price(totals.revenue)}
          note="What was placed, not what has been paid."
        />
        <StatTile label="units" value={totals.items} />
        <StatTile label="as guest" value={totals.guests} note="Checked out without an account." />
      </div>

      <p className="mt-7 mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-term-dim uppercase">
        <span className="text-term-cyan" aria-hidden>
          ▸
        </span>
        orders · newest first
      </p>

      {orders.length === 0 ? (
        <p className="rounded-card border border-dashed border-term-line px-3 py-3 text-[12px] text-term-dim">
          No orders yet.
        </p>
      ) : (
        <ul className="divide-y divide-term-line border-y border-term-line">
          {orders.map((order) => (
            <li key={order.orderNo} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <span className="w-32 shrink-0 text-[13px] text-term-text">{order.orderNo}</span>
              <span className="w-24 shrink-0 text-[12px] text-turmeric-500">{price(order.total)}</span>
              <span className="w-20 shrink-0 text-[12px] text-term-dim">
                {order.itemCount} {order.itemCount === 1 ? "unit" : "units"}
              </span>
              <span className="w-20 shrink-0 text-[12px] text-term-dim">{order.status}</span>
              <span className="flex-1 truncate text-[12px] text-term-dim">
                {order.slugs
                  .map((slug) => getProduct(slug)?.title ?? slug)
                  .join(" · ")}
              </span>
              <span className="shrink-0 text-[12px] text-term-dim">
                <When iso={order.createdAt} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-term-dim">
        Ordered value is what was placed, not what has been paid — nothing here settles a payment.{" "}
        <Link href="/admin" className="text-term-cyan hover:underline">
          overview
        </Link>
      </p>
    </section>
  );
}
