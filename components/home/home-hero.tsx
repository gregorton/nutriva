import { existsSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, bestSellers, products } from "@/lib/catalog";
import { price } from "@/lib/format";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel, type HeroPick } from "@/components/home/hero-carousel";

/**
 * Home hero — the server half of the two-slide banner. The four examples are the current best
 * sellers that are in stock, and the figures beside the copy are counted off the catalogue, so a
 * refresh re-resolves both.
 */
/** Lifestyle shot for the supplements slide. Absent until the file is dropped in, and the slide
 *  renders on the plain field without it, so a missing asset cannot break the build. */
const HERO_PHOTO = "/hero/vitamins-lifestyle.jpg";

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

  const photo = existsSync(path.join(process.cwd(), "public", HERO_PHOTO)) ? HERO_PHOTO : null;

  return <HeroCarousel picks={picks} ranges={EQUIPMENT_RANGES} stats={stats} photo={photo} />;
}
