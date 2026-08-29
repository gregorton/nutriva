import type { StaticImageData } from "next/image";
import { CATEGORIES, CATEGORY_BY_SLUG, byCategory, products, type CategorySlug } from "@/lib/catalog";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel } from "@/components/home/hero-carousel";
import type { RangeSlide, ShelfSlide } from "@/components/home/hero-slides";
import flatLay from "@/public/hero/supplements-flat-lay.png";
import vitaminsShot from "@/public/hero/vitamins-native.jpg";
import mineralsShot from "@/public/hero/minerals-native.jpg";
import immunityShot from "@/public/hero/supplements-04-immunity.jpg";
import omegaShot from "@/public/hero/supplements-05-omega.jpg";
import herbsShot from "@/public/hero/supplements-06-herbal.jpg";

/**
 * Home hero — the server half of the two-tab banner. Every figure beside the copy is counted off
 * the catalogue, so a refresh re-resolves them, and this is the only half that imports
 * `lib/catalog.ts`: doing it from the client component would put the generated catalogue in the
 * browser bundle.
 */

/*
  The photographs are imported, not looked up. They used to be paths checked with
  `existsSync(process.cwd() + "/public" + …)` so that a missing file left the copy on a plain field
  instead of failing the build — which read as harmless and was not: a Worker has no filesystem, so
  in production every one of those checks returned false and the hero shipped with no photograph at
  all. Importing them puts the question to the bundler, where a missing file is a build error and
  the emitted URL is a hashed, immutable asset. Adding or swapping a shot is now a file drop plus an
  import.
*/

/**
 * The shelves the arrow advances through after the opening slide, in the order the photographs were
 * supplied in. Every shot here is composed the same way as the flat-lay — subject in the right-hand
 * two thirds, bare wood on the left — because the copy column sits in that empty half.
 */
const SHELVES: { slug: CategorySlug; cta: string; photo: StaticImageData }[] = [
  { slug: "vitamins", cta: "Shop vitamins", photo: vitaminsShot },
  { slug: "minerals", cta: "Shop minerals", photo: mineralsShot },
  { slug: "immunity", cta: "Shop immunity", photo: immunityShot },
  { slug: "omega", cta: "Shop omega", photo: omegaShot },
  { slug: "herbs", cta: "Shop herbs", photo: herbsShot },
];

export function HomeHero() {
  const stats = {
    products: products.filter((product) => product.inStock).length,
    brands: new Set(products.map((product) => product.brand)).size,
    shelves: CATEGORIES.length,
  };

  const opening: ShelfSlide = {
    id: "all",
    heading: "Vitamins, minerals and daily essentials",
    blurb: null,
    figures: `${stats.products} products · ${stats.brands} brands · ${stats.shelves} shelves`,
    cta: { href: "/c/vitamins", label: "Shop All" },
    link: { href: "/#shelf", label: "Browse all shelves" },
    photo: flatLay,
  };

  // A shelf that is not in the catalogue is dropped rather than published empty, the same rule
  // `lib/starters.ts` follows for a role the stock cannot fill.
  const shelves: ShelfSlide[] = SHELVES.flatMap(({ slug, cta, photo }) => {
    const category = CATEGORY_BY_SLUG.get(slug);
    if (!category) return [];

    const inStock = byCategory(slug).filter((product) => product.inStock).length;

    return [
      {
        id: slug,
        heading: category.name,
        blurb: category.blurb,
        figures: `${inStock} in stock`,
        cta: { href: `/c/${slug}`, label: cta },
        link: null,
        photo,
      },
    ];
  });

  const ranges: RangeSlide[] = EQUIPMENT_RANGES.map((range) => ({
    id: range.glyph,
    heading: range.name,
    spec: range.spec,
    figures: `${EQUIPMENT_RANGES.length} ranges · opening soon`,
    glyph: range.glyph,
    cta: { href: "/equipment", label: "Shop Now" },
  }));

  return <HeroCarousel supplements={[opening, ...shelves]} equipment={ranges} />;
}
