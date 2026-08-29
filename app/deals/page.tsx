import type { Metadata } from "next";
import { deals } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Countdown } from "@/components/home/countdown";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export const metadata: Metadata = {
  title: "Deals",
  description: "Today's markdowns across the Slim Wellness Asia catalogue. Resets at midnight ICT.",
};

export default function DealsPage() {
  const items = deals(Infinity);

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="deals" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Deals" }]} />

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-[28px] sm:text-[34px]">Today&apos;s deals</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            <span className="font-semibold text-ink" data-num>
              {items.length}
            </span>{" "}
            products marked down. Prices return to normal at midnight.
          </p>
        </div>
        <Countdown />
      </header>

      <div className="mt-6">
        <ProductGrid products={items} />
      </div>
    </div>
  );
}
