import { CATEGORIES, bestSellers, products } from "@/lib/catalog";
import { price } from "@/lib/format";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel, type HeroPick } from "@/components/home/hero-carousel";

/**
 * Home hero — the server half of the two-slide banner. The four examples are the current best
 * sellers that are in stock, and the figures beside the copy are counted off the catalogue, so a
 * refresh re-resolves both.
 */
export function HomeHero() {
  const picks: HeroPick[] = bestSellers(12)
    .filter((product) => product.inStock)
    .slice(0, 4)
    .map((product) => ({
      slug: product.slug,
      brand: product.brand,
      title: product.title,
      image: product.image,
      price: price(product.price),
    }));

  const stats = {
    products: products.filter((product) => product.inStock).length,
    brands: new Set(products.map((product) => product.brand)).size,
    shelves: CATEGORIES.length,
  };

  return <HeroCarousel picks={picks} ranges={EQUIPMENT_RANGES} stats={stats} />;
}
