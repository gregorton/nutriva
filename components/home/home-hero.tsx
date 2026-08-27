import { CATEGORIES, bestSellers, products } from "@/lib/catalog";
import { price } from "@/lib/format";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel, type HeroPick } from "@/components/home/hero-carousel";

/**
 * Home hero — the server half of the two-slide banner.
 *
 * Everything the hero states is read off the catalogue here: the four examples are the current
 * best sellers that are actually in stock, and the three figures beside the copy are counted,
 * not typed. The slide itself is a client component only because the arrow moves between the
 * two colour fields; the data it renders is resolved at build time.
 *
 * This replaced a five-tile mosaic traced off the reference site's promotional hero. Nothing in
 * that mosaic was ours or true — a sale that does not exist, a product count off by an order of
 * magnitude, hotlinked stock photography, a sign-in button with no account system behind it.
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
