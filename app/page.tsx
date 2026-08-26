import { bestSellers, newArrivals, topRated } from "@/lib/catalog";
import { GoalHero } from "@/components/home/goal-hero";
import { StarterKits } from "@/components/home/starter-kits";
import { CategoryTiles } from "@/components/home/category-tiles";
import { TrustBand } from "@/components/home/trust-band";
import { EditorialStrip } from "@/components/home/editorial-strip";
import { ProductRail } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";

export default function HomePage() {
  return (
    <>
      <GoalHero />
      <StarterKits />
      <CategoryTiles />

      <section className="shell mt-14">
        <SectionHeader
          kicker="Ranked by units sold in the last 30 days"
          title="Best sellers"
          href="/c/vitamins"
        />
        <div className="mt-5">
          <ProductRail products={bestSellers(12)} />
        </div>
      </section>

      <TrustBand />

      <section className="shell mt-14">
        <SectionHeader kicker="Newly stocked" title="Just landed" href="/c/sports" />
        <div className="mt-5">
          <ProductRail products={newArrivals(12)} />
        </div>
      </section>

      <section className="shell mt-14">
        <SectionHeader kicker="Rated 4.7 and above" title="Highest rated" href="/c/minerals" />
        <div className="mt-5">
          <ProductRail products={topRated(12)} />
        </div>
      </section>

      <EditorialStrip />
    </>
  );
}
