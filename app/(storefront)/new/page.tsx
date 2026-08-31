import type { Metadata } from "next";
import { newArrivals } from "@/lib/catalog";
import type { RawSearchParams } from "@/lib/query";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductListing } from "@/components/plp/product-listing";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The most recently introduced products on the shelves, by the date the label says each first shipped.",
};

/*
  New arrivals off a real field, not a label somebody applied.

  Every product carries `firstAvailable` — the month the manufacturer first shipped it, MM/YYYY,
  set on all 470 — and 140 of them are 2025 or 2026. The footer's "New arrivals" link used to point
  at /c/sports, which was simply untrue.

  "New" here means new to the market rather than new to this warehouse: the catalogue records when
  the product appeared, and nothing records when a box arrived in Bangkok. The kicker says so.
*/
export default async function NewPage({ searchParams }: PageProps<"/new">) {
  const raw = (await searchParams) as RawSearchParams;
  const pool = newArrivals(120);

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="new" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "New arrivals" }]} />

      <header className="mt-3 border-b border-line pb-5">
        <p className="kicker text-muted">By the month each first shipped</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[34px]">New arrivals</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted">
          The 120 most recently introduced products we stock. The date is the manufacturer&rsquo;s
          first-available month off the label, so this is new to the market rather than new to our
          warehouse.
        </p>
      </header>

      <ProductListing base="/new" raw={raw} pool={pool} defaultSort="newest" />
    </div>
  );
}
