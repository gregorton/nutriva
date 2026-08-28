import { existsSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, products } from "@/lib/catalog";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel } from "@/components/home/hero-carousel";

/**
 * Home hero — the server half of the two-slide banner. The figures beside the copy are counted
 * off the catalogue, so a refresh re-resolves them.
 */

/** The flat-lay behind the supplements slide. Checked on disk rather than imported, so replacing
 *  it is a file drop and a missing one leaves the copy on the plain field instead of failing the
 *  build. The name is the file as supplied — spaces and all; `next/image` encodes the URL. */
const HERO_PHOTO = "/hero/Supplements flat-lay banner v3.png";

export function HomeHero() {
  const stats = {
    products: products.filter((product) => product.inStock).length,
    brands: new Set(products.map((product) => product.brand)).size,
    shelves: CATEGORIES.length,
  };

  const photo = existsSync(path.join(process.cwd(), "public", HERO_PHOTO)) ? HERO_PHOTO : null;

  return <HeroCarousel ranges={EQUIPMENT_RANGES} stats={stats} photo={photo} />;
}
