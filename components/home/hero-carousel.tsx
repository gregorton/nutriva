"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { EquipmentGlyph, type EquipmentRange } from "@/components/home/equipment-glyphs";

/**
 * The home hero: two slides, supplements on the brand plum and medical equipment on the
 * Professional brands blue. Both fields are the same `banner-*` ramp from `globals.css`.
 * The colour sits on two stacked layers whose opacity is animated, because a gradient cannot
 * be transitioned directly.
 */

/** A product as the hero needs it — price formatted server-side. */
export type HeroPick = {
  slug: string;
  brand: string;
  title: string;
  image: string;
  price: string;
};

const SLIDE_LABELS = ["Supplements", "Medical equipment"] as const;

export function HeroCarousel({
  picks,
  ranges,
  stats,
}: {
  picks: HeroPick[];
  ranges: EquipmentRange[];
  stats: { products: number; brands: number; shelves: number };
}) {
  const [slide, setSlide] = useState(0);
  const onEquipment = slide === 1;

  return (
    <section className="shell pt-4" aria-labelledby="hero-heading">
      <div
        className="relative overflow-hidden rounded-tile"
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured shelves"
      >
        {/* Colour fields. Two layers, cross-faded — see the note above. */}
        <div
          className="banner-plum pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
          style={{ opacity: onEquipment ? 0 : 1 }}
          aria-hidden
        />
        <div
          className="banner-clinic pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
          style={{ opacity: onEquipment ? 1 : 0 }}
          aria-hidden
        />
        {/* One shared vignette, so the highlight does not jump between slides. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.16),transparent_62%)]"
          aria-hidden
        />

        {/* Slide track. Both slides stay mounted so the height is stable; the one off-screen is
            inert, which takes it out of the tab order and off the accessibility tree. */}
        <div
          className="relative flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          <div className="w-full shrink-0" inert={onEquipment}>
            <SupplementsSlide picks={picks} stats={stats} active={!onEquipment} />
          </div>
          <div className="w-full shrink-0" inert={!onEquipment}>
            <EquipmentSlide ranges={ranges} active={onEquipment} />
          </div>
        </div>

        {/* Edge arrows — the right one is the transition into medical equipment. */}
        <NavArrow
          direction="prev"
          label="Show supplements"
          disabled={!onEquipment}
          onClick={() => setSlide(0)}
        />
        <NavArrow
          direction="next"
          label="Show medical equipment"
          disabled={onEquipment}
          onClick={() => setSlide(1)}
        />

        {/* Slide switcher. Labelled rather than dots: with two slides the label is the
            useful information, and it doubles as a second route to the equipment side. */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3.5">
          <div className="flex items-center gap-1 rounded-full bg-black/25 p-1 backdrop-blur-sm">
            {SLIDE_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setSlide(index)}
                aria-pressed={slide === index}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  slide === index ? "bg-white text-ink" : "text-white/80 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NavArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition disabled:pointer-events-none disabled:opacity-0 hover:bg-white sm:h-11 sm:w-11 ${
        direction === "next" ? "right-2 sm:right-3" : "left-2 sm:left-3"
      }`}
    >
      <ArrowIcon className={`h-5 w-5 ${direction === "prev" ? "rotate-180" : ""}`} />
    </button>
  );
}

/* ── Slide shell ─────────────────────────────────────────────────────────────────────────── */

/**
 * Shared frame. Padding clears the edge arrows at every width, and the two columns keep the
 * same proportion on both slides so nothing shifts horizontally during the cross-fade.
 */
function SlideFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-7 px-12 pb-16 pt-8 sm:px-14 sm:pb-14 lg:min-h-[400px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:gap-10 lg:px-[72px] lg:pb-12">
      {children}
    </div>
  );
}

/* Examples grid and its tiles — one set of classes, so both slides line up to the pixel. */
const GRID = "grid grid-cols-2 gap-2.5 sm:gap-3";
const TILE = "flex h-full flex-col rounded-card bg-white/95 p-2.5 sm:p-3";
const SHOT = "relative h-[76px] w-full overflow-hidden rounded-[7px] sm:h-[104px] lg:h-[116px]";

/** Shop Now, identical on both slides. */
function ShopNow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ink shadow-[0_2px_14px_rgba(0,0,0,0.22)] transition hover:bg-paper"
    >
      {children}
      <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ── Slide 1: supplements ────────────────────────────────────────────────────────────────── */

function SupplementsSlide({
  picks,
  stats,
  active,
}: {
  picks: HeroPick[];
  stats: { products: number; brands: number; shelves: number };
  active: boolean;
}) {
  return (
    <SlideFrame>
      <div className="relative">
        <p className="kicker text-turmeric-200">Supplements</p>
        <h1
          id={active ? "hero-heading" : undefined}
          className="mt-2 text-balance text-[27px] leading-[1.06] text-white sm:text-[38px] lg:text-[42px]"
        >
          Vitamins, minerals and daily essentials
        </h1>
        <p className="mt-3.5 text-[14.5px] text-white/85" data-num>
          {stats.products} products · {stats.brands} brands · {stats.shelves} shelves
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <ShopNow href="/c/vitamins">Shop Now</ShopNow>
          <Link
            href="/#shelf"
            className="text-[13.5px] font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
          >
            Browse all shelves
          </Link>
        </div>
      </div>

      {/* Examples: best sellers in stock, each straight through to its page. */}
      <ul className={GRID}>
        {picks.map((pick) => (
          <li key={pick.slug}>
            <Link href={`/p/${pick.slug}`} className={`group ${TILE} transition hover:bg-white`}>
              <div className={SHOT}>
                <Image
                  src={pick.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 40vw, 160px"
                  className="object-contain p-1"
                />
              </div>
              <p className="facts mt-2 truncate text-plum-700">{pick.brand}</p>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink group-hover:underline">
                {pick.title}
              </p>
              <p className="mt-1 text-[13.5px] font-semibold text-ink" data-num>
                {pick.price}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </SlideFrame>
  );
}

/* ── Slide 2: medical equipment ──────────────────────────────────────────────────────────── */

function EquipmentSlide({ ranges, active }: { ranges: EquipmentRange[]; active: boolean }) {
  return (
    <SlideFrame>
      <div className="relative">
        <p className="kicker text-white/70">Medical equipment</p>
        <h2
          id={active ? "hero-heading" : undefined}
          className="mt-2 text-balance text-[27px] leading-[1.06] text-white sm:text-[38px] lg:text-[42px]"
        >
          Home monitoring and respiratory
        </h2>
        <p className="mt-3.5 text-[14.5px] text-white/85" data-num>
          {ranges.length} ranges · opening soon
        </p>

        <div className="mt-7">
          <ShopNow href="/equipment">Shop Now</ShopNow>
        </div>
      </div>

      {/* Examples: the four ranges. */}
      <ul className={GRID}>
        {ranges.map((range) => (
          <li key={range.name} className={TILE}>
            <div className={`${SHOT} flex items-center justify-center bg-clinic-100 text-clinic-700`}>
              <EquipmentGlyph range={range.glyph} className="h-[58px] w-[58px] lg:h-[76px] lg:w-[76px]" />
            </div>
            <p className="mt-2 text-[12.5px] font-medium leading-snug text-ink">{range.name}</p>
            <p className="facts mt-1">{range.spec}</p>
          </li>
        ))}
      </ul>
    </SlideFrame>
  );
}
