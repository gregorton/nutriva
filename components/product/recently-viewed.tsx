"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getProduct } from "@/lib/catalog";
import { ProductRail } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";
import {
  recordViewed,
  subscribeToViewed,
  viewedServerSnapshot,
  viewedSnapshot,
} from "@/components/product/recently-viewed-store";

/**
 * Records the product being looked at. Mounted on /p/[slug], which is prerendered, so this is the
 * only place that can know a page was opened in a browser. Separate from
 * components/analytics/view-beacon.tsx on purpose: that one increments an anonymous counter on the
 * server, this one writes a list that never leaves the browser.
 */
export function RecordViewed({ slug }: { slug: string }) {
  useEffect(() => {
    recordViewed(slug);
  }, [slug]);

  return null;
}

/**
 * The rail. Renders nothing at all when there is nothing to show — including on the server and on
 * the first client pass — so a first visit has no empty heading and no layout shift.
 */
export function RecentlyViewed({
  /** The product being viewed, left out of its own rail. */
  exclude,
  title = "Recently viewed",
  kicker = "Where you have been on this browser",
}: {
  exclude?: string;
  title?: string;
  kicker?: string;
}) {
  const slugs = useSyncExternalStore(subscribeToViewed, viewedSnapshot, viewedServerSnapshot);

  const products = slugs
    .filter((slug) => slug !== exclude)
    .map(getProduct)
    .filter((product) => product !== undefined);

  if (products.length < 2) return null;

  return (
    <section className="mt-14">
      <SectionHeader kicker={kicker} title={title} />
      <div className="mt-5">
        <ProductRail products={products} />
      </div>
    </section>
  );
}
