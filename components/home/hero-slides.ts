import type { StaticImageData } from "next/image";
import type { EquipmentGlyphName } from "@/components/home/equipment-glyphs";

/*
  The hero's slides, shaped here so the server half can compose them off the catalogue and the
  client half can stay a renderer. `lib/catalog.ts` reads the whole generated catalogue at import,
  so nothing the browser loads is allowed to touch it — these types are the boundary.
*/

/** One press. */
export type HeroCta = { href: string; label: string };

/** A slide on the Supplements tab: a shelf, over the photograph. */
export type ShelfSlide = {
  id: string;
  heading: string;
  /** the shelf's own blurb, or null on the opening slide, which has figures instead */
  blurb: string | null;
  /** the tabular line under it — counted off the catalogue, never written by hand */
  figures: string;
  cta: HeroCta;
  /** the one cross-link, on the opening slide only */
  link: HeroCta | null;
  /** this slide's photograph, imported so the bundler resolves it — never a path read at runtime */
  photo: StaticImageData;
};

/** A slide on the Medical equipment tab: one range, on the blue field. */
export type RangeSlide = {
  id: string;
  heading: string;
  spec: string;
  figures: string;
  glyph: EquipmentGlyphName;
  cta: HeroCta;
};
