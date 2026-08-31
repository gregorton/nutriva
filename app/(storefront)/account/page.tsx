import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct, type Product } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { price, reviewDate } from "@/lib/format";
import { ordersForUser } from "@/lib/orders";
import { savedSlugs } from "@/lib/saved";
import { reviewsByUser } from "@/lib/reviews";
import { ProductCard } from "@/components/product/product-card";
import { Stars } from "@/components/ui/stars";
import { EmptyPanel, Panel, StatusPill } from "@/components/account/account-panels";
import { ArrowIcon, UserIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Your account" };

/*
  Overview: the three figures the account holds, then the newest row of each list.

  Everything here is a summary of a page in the sidebar, so nothing is editable and no panel
  repeats another panel's layout: figures on a divided strip, the order as one wide row, saved
  items as the same card the shelves use, the review as itself.
*/
export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, saved, reviews] = await Promise.all([
    ordersForUser(user.id),
    savedSlugs(user.id),
    reviewsByUser(user.id),
  ]);

  // Resolved against the catalogue, so a product retired by a refresh drops out rather than
  // breaking the tile. Same rule the saved list and the cart apply.
  const savedProducts = saved
    .map(getProduct)
    .filter((product): product is Product => product !== undefined);

  const latestOrder = orders[0];
  const latestReview = reviews[0];
  const reviewed = latestReview ? getProduct(latestReview.slug) : undefined;

  if (orders.length === 0 && savedProducts.length === 0 && reviews.length === 0) {
    return (
      <EmptyPanel
        icon={<UserIcon className="h-9 w-9" />}
        title={`Welcome, ${user.displayName}`}
        action={{ href: "/starters", label: "See starter kits" }}
      >
        This account keeps your orders, the products you save with the heart, and the reviews you
        write. Nothing is in it yet.
      </EmptyPanel>
    );
  }

  return (
    <>
      <Panel padded={false}>
        <div className="grid grid-cols-3 divide-x divide-line">
          <Figure href="/account/orders" label="Orders" value={orders.length} />
          <Figure href="/account/saved" label="Saved" value={savedProducts.length} />
          <Figure href="/account/reviews" label="Reviews" value={reviews.length} />
        </div>
      </Panel>

      {latestOrder && (
        <Panel title="Latest order" action={{ href: "/account/orders", label: "All orders" }}>
          <Link
            href={`/account/orders/${latestOrder.orderNo}`}
            className="group flex flex-wrap items-center gap-x-5 gap-y-4"
          >
            <ul className="flex shrink-0 gap-1.5">
              {latestOrder.slugs.map((slug) => {
                const product = getProduct(slug);
                return (
                  <li key={slug} className="relative h-14 w-14 bg-paper">
                    {product && (
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink" data-num>
                {latestOrder.orderNo}
              </p>
              <p className="facts mt-1" data-num>
                {reviewDate(latestOrder.createdAt)} · {latestOrder.itemCount}{" "}
                {latestOrder.itemCount === 1 ? "item" : "items"}
              </p>
              <div className="mt-2">
                <StatusPill status={latestOrder.status} />
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[19px] font-semibold text-ink" data-num>
                {price(latestOrder.total)}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-plum-700">
                View order
                <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </Panel>
      )}

      {savedProducts.length > 0 && (
        <Panel
          title="Saved items"
          meta={savedProducts.length > 4 ? `4 of ${savedProducts.length}` : undefined}
          action={{ href: "/account/saved", label: "All saved" }}
        >
          {/* Columns come off the count, so three saved items make three cells rather than three
              cells and a hole, and a cell is capped so two of them do not become two posters. */}
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(var(--cells),minmax(0,224px))]"
            style={{ "--cells": Math.min(savedProducts.length, 4) } as React.CSSProperties}
          >
            {savedProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Panel>
      )}

      {latestReview && reviewed && (
        <Panel
          title="Your latest review"
          action={{ href: "/account/reviews", label: "All reviews" }}
        >
          <div className="flex gap-4">
            <Link href={`/p/${reviewed.slug}`} className="relative h-16 w-16 shrink-0 bg-paper">
              <Image
                src={reviewed.image}
                alt={`${reviewed.brand} ${reviewed.title}`}
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="facts truncate text-plum-700">{reviewed.brand}</p>
              <h3 className="mt-0.5 text-[14.5px] font-medium leading-snug">
                <Link href={`/p/${reviewed.slug}`} className="hover:underline">
                  {reviewed.title}
                </Link>
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={latestReview.rating} size="sm" />
                <span className="facts" data-num>
                  {reviewDate(latestReview.createdAt)}
                </span>
              </div>
              {latestReview.title && (
                <p className="mt-3 text-[14.5px] font-semibold text-ink">{latestReview.title}</p>
              )}
              <p className="mt-1 line-clamp-3 max-w-[70ch] text-sm leading-relaxed text-ink">
                {latestReview.body}
              </p>
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}

/** One figure on the strip. The label sits under it, so the numbers line up as a row. */
function Figure({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      href={href}
      className="px-3 py-5 text-center transition-colors hover:bg-paper sm:px-5 sm:text-left"
    >
      <p className="font-display text-[30px] leading-none text-ink sm:text-[34px]" data-num>
        {value}
      </p>
      <p className="kicker mt-2 text-muted">{label}</p>
    </Link>
  );
}
