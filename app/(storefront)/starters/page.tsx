import type { Metadata } from "next";
import { KITS, startersUnder } from "@/lib/starters";
import { GUIDES } from "@/lib/guides";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { KitCard } from "@/components/starters/kit-card";
import { GuideCard } from "@/components/guides/guide-card";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export const metadata: Metadata = {
  title: "Starter kits",
  description: "Best-selling picks for a first shelf, at their usual prices.",
};

/* Starter-kit shelf: kits at regular prices. */
export default function StartersPage() {
  const singles = startersUnder(500, 30, 10);
  const guides = GUIDES.filter((g) => KITS.some((k) => k.guides.includes(g.slug))).slice(0, 3);

  return (
    <div className="shell py-6 pb-10">
      <ViewBeacon kind="surface" value="starters" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Starter kits" }]} />

      <header className="mt-3 border-b border-line pb-6">
        <p className="kicker text-[11.5px] tracking-[0.12em] text-plum-700">
          Picked for a first shelf · 16 and up
        </p>
        <h1 className="mt-1.5 text-[28px] font-extrabold leading-none tracking-tight text-ink sm:text-[34px]">
          Recommended
        </h1>
      </header>

      <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {KITS.map((kit) => (
          <li key={kit.slug}>
            <KitCard kit={kit} />
          </li>
        ))}
      </ul>

      {singles.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            kicker="Under ฿500, a month or more per pack, 4.5 and above"
            title="One bottle at a time"
            href="/deals"
            linkLabel="See markdowns"
          />
          <div className="mt-5">
            <ProductGrid products={singles} />
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-14 pb-2">
          <SectionHeader
            kicker="The label arithmetic, first"
            title="Read before you buy"
            href="/guides"
            linkLabel="All guides"
          />
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <GuideCard guide={guide} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
