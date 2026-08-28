import { existsSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, products } from "@/lib/catalog";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel } from "@/components/home/hero-carousel";

/**
 * Home hero — the server half of the two-slide banner. The figures beside the copy are counted
 * off the catalogue, so a refresh re-resolves them.
 */

/** Lifestyle shot for the supplements slide. Absent until the file is dropped in, and the slide
 *  renders on the plain field without it, so a missing asset cannot break the build. */
const HERO_PHOTO = "/hero/vitamins-lifestyle.jpg";

export function HomeHero() {
  const stats = {
    products: products.filter((product) => product.inStock).length,
    brands: new Set(products.map((product) => product.brand)).size,
    shelves: CATEGORIES.length,
  };

  const photo = existsSync(path.join(process.cwd(), "public", HERO_PHOTO)) ? HERO_PHOTO : null;

  return <HeroCarousel ranges={EQUIPMENT_RANGES} stats={stats} photo={photo} />;
}
