import { existsSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, CATEGORY_BY_SLUG, byCategory, products, type CategorySlug } from "@/lib/catalog";
import { EQUIPMENT_RANGES } from "@/components/home/equipment-glyphs";
import { HeroCarousel } from "@/components/home/hero-carousel";
import type { RangeSlide, ShelfSlide } from "@/components/home/hero-slides";

/**
 * Home hero — the server half of the two-tab banner. Every figure beside the copy is counted off
 * the catalogue, so a refresh re-resolves them, and this is the only half that imports
 * `lib/catalog.ts`: doing it from the client component would put the generated catalogue in the
 * browser bundle.
 */

/** The flat-lay the supplements tab is built on, and the stand-in for any slide with no shot of
 *  its own. Checked on disk rather than imported, so replacing it is a file drop and a missing one
 *  leaves the copy on the plain field instead of failing the build. The name is the file as
 *  supplied — spaces and all; `next/image` encodes the URL. */
const HERO_PHOTO = "/hero/Supplements flat-lay banner v3.png";

/**
 * The shelves the arrow advances through after the opening slide, in the order the photographs were
 * supplied in. `photo` is that shelf's own shot; a shelf whose file is not on disk falls back to the
 * flat-lay rather than failing the build, so adding or swapping a shelf is a file drop and a line
 * here. Every shot in this list is composed the same way as the flat-lay — subject in the right-hand
 * two thirds, bare wood on the left — because the copy column sits in that empty half.
 */
const SHELVES: { slug: CategorySlug; cta: string; photo: string }[] = [
  { slug: "vitamins", cta: "Shop vitamins", photo: "/hero/vitamins-native.jpg" },
  { slug: "minerals", cta: "Shop minerals", photo: "/hero/minerals-native.jpg" },
  { slug: "immunity", cta: "Shop immunity", photo: "/hero/supplements-04-immunity.jpg" },
  { slug: "omega", cta: "Shop omega", photo: "/hero/supplements-05-omega.jpg" },
  { slug: "herbs", cta: "Shop herbs", photo: "/hero/supplements-06-herbal.jpg" },
];

function onDisk(file: string): string | null {
  return existsSync(path.join(process.cwd(), "public", file)) ? file : null;
}

export function HomeHero() {
  const stats = {
    products: products.filter((product) => product.inStock).length,
    brands: new Set(products.map((product) => product.brand)).size,
    shelves: CATEGORIES.length,
  };

  const flatLay = onDisk(HERO_PHOTO);

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
        photo: onDisk(photo) ?? flatLay,
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
