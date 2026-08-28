"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { EquipmentGlyph, type EquipmentRange } from "@/components/home/equipment-glyphs";

/**
 * The home hero: two slides in one 21:9 banner frame. Supplements is photo-led — the flat-lay is
 * the whole field, and the copy and its button sit in the empty half of the shot, the way a
 * printed banner works. Medical equipment keeps the Professional brands blue.
 *
 * Each slide owns its own background now. The supplements side used to run the `banner-plum`
 * ramp, so the two fields were stacked layers cross-fading their opacity (a gradient cannot be
 * transitioned directly); with a photograph on one side there is nothing left to cross-fade,
 * and the slides simply translate.
 */

const SLIDE_LABELS = ["Supplements", "Medical equipment"] as const;

export function HeroCarousel({
  ranges,
  stats,
  photo,
}: {
  ranges: EquipmentRange[];
  stats: { products: number; brands: number; shelves: number };
  /** The flat-lay the supplements slide is built on, or null when the file is not in place. */
  photo?: string | null;
}) {
  const [slide, setSlide] = useState(0);
  const onEquipment = slide === 1;

  return (
    <section className="shell pt-4" aria-labelledby="hero-heading">
      {/* 21:9 from `lg` up — the banner shape. Below it the height comes from the content, because
          21:9 on a phone is a 160px letterbox with nowhere to put a heading. The hairline ring is
          not decoration: a near-white photograph on a white page has no edge of its own, and
          without it the rounded corners read as a rendering fault. */}
      <div
        className="relative overflow-hidden rounded-tile bg-white ring-1 ring-line lg:aspect-[21/9]"
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured shelves"
      >
        {/* Slide track. Both slides stay mounted so the height is stable; the one off-screen is
            inert, which takes it out of the tab order and off the accessibility tree. `h-full`
            is what hands the frame's 21:9 height down to the slides. */}
        <div
          className="relative flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          <div className="w-full shrink-0" inert={onEquipment}>
            <SupplementsSlide stats={stats} photo={photo} active={!onEquipment} />
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
            useful information, and it doubles as a second route to the equipment side.
            Left-aligned with the copy above it rather than centred, because centred it lands on
            the middle of the flat-lay and covers the thing the banner is showing. The pill is
            plum at 70% rather than black at 25% — it now has to hold white type over a
            near-white photograph as well as over the blue field. */}
        <div className="absolute inset-x-0 bottom-0 flex justify-start pb-3.5 pl-12 sm:pl-14 xl:pl-[72px]">
          <div className="flex items-center gap-1 rounded-full bg-plum-900/70 p-1 backdrop-blur-sm">
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
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-plum-900 ring-1 ring-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.22)] transition disabled:pointer-events-none disabled:opacity-0 hover:bg-paper sm:h-11 sm:w-11 ${
        direction === "next" ? "right-2 sm:right-3" : "left-2 sm:left-3"
      }`}
    >
      <ArrowIcon className={`h-5 w-5 ${direction === "prev" ? "rotate-180" : ""}`} />
    </button>
  );
}

/* ── Slide shell ─────────────────────────────────────────────────────────────────────────── */

/**
 * Frame for the equipment slide. Padding clears the edge arrows at every width, and `h-full`
 * lets the tiles centre in the banner rather than sitting at the top of it. The supplements
 * slide carries its own frame — it is one column of copy over a full-bleed photograph.
 */
function SlideFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-full items-center gap-7 px-12 pb-16 pt-8 sm:px-14 sm:pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:gap-10 lg:px-[72px] lg:pb-8 lg:pt-6 xl:pb-12 xl:pt-8">
      {children}
    </div>
  );
}

/* The equipment tiles. Glass rather than white, so the blue field reads through them and the
   banner stays one surface instead of four cards pasted onto it; the glyph keeps its own pale
   plate so the line art has something to sit on. The plate shrinks between `lg` and `xl` rather
   than growing: that is the range where 21:9 is at its shortest — 425px at a 1024 viewport — and
   two rows of tiles at their full size would sit flush against the foot of the banner. */
const GRID = "grid grid-cols-2 gap-2.5 sm:gap-3";
const TILE =
  "flex h-full flex-col rounded-card bg-white/12 p-2.5 ring-1 ring-inset ring-white/25 shadow-[0_2px_14px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-3";
const SHOT =
  "relative h-[76px] w-full overflow-hidden rounded-[7px] bg-white sm:h-[104px] lg:h-[96px] xl:h-[116px]";

/**
 * The one button on a slide, in the two tones the two fields need: plum fill on the light
 * photograph (the site's primary button everywhere else it sits on white), white fill on the
 * blue field. Never `btn-cart` — that gradient is add-to-cart and nothing else.
 */
const CTA_TONE = {
  plum: "bg-plum-800 text-white shadow-[0_2px_14px_rgba(43,15,32,0.24)] hover:bg-plum-700",
  white: "bg-white text-ink shadow-[0_2px_14px_rgba(0,0,0,0.22)] hover:bg-paper",
} as const;

function ShopButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: keyof typeof CTA_TONE;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition ${CTA_TONE[tone]}`}
    >
      {children}
      <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ── Slide 1: supplements ────────────────────────────────────────────────────────────────── */

/**
 * Photo-led, and the photograph is the banner: the flat-lay was shot with its left half empty,
 * so the copy and the button go in that empty half and no scrim is needed to hold them apart
 * from the subject. Dark type on the wood, plum button, one cross-link — the previous version
 * of this slide put white type on a plum field with the shot masked into the right-hand edge,
 * which is a different composition entirely and is why nothing here is inherited from it.
 */
function SupplementsSlide({
  stats,
  photo,
  active,
}: {
  stats: { products: number; brands: number; shelves: number };
  photo?: string | null;
  active: boolean;
}) {
  return (
    <div className="relative h-full">
      {photo ? (
        <>
          {/* One `Image`, two compositions, so the hero preloads one file rather than two.
              From `lg` it is the whole field (`inset-0`, cover). Below that the copy cannot fit in
              43% of a phone's width, so the shot becomes a band across the foot of the slide with
              the copy above it on white — height as a percentage rather than an aspect ratio,
              because the banner's height there is set by whichever slide is taller and a fixed
              ratio leaves a white gap under the copy. Its top edge is masked: a hard seam between
              the wood and the page is the one thing that gives away a photograph pasted into a
              box. The crop is biased down the frame and to the right — the three spoons sit below
              centre and in the right-hand two thirds, so a centred window cuts the last of them
              in half and a narrow one lands on empty wood. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] [mask-image:linear-gradient(to_bottom,transparent,black_32%)] md:h-[58%] lg:inset-0 lg:h-auto lg:[mask-image:none]"
            aria-hidden
          >
            <Image
              src={photo}
              alt=""
              fill
              priority
              sizes="(min-width: 1376px) 1312px, 100vw"
              className="object-cover object-[100%_62%]"
            />
          </div>
          {/* A wash under the copy, `lg` only. The wood there is already close to white, so this
              evens out its grain rather than covering anything: enough that the heading holds if
              a wider viewport shifts the crop, not enough to read as a panel. */}
          <div
            className="pointer-events-none absolute inset-0 hidden lg:block lg:bg-[linear-gradient(100deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.34)_26%,rgba(255,255,255,0)_56%)]"
            aria-hidden
          />
        </>
      ) : null}

      {/* The copy column is measured against the empty half of the shot, which is the left 43%
          of it: at `lg` that is 426px of a 992px banner, so the block narrows there and only
          widens again at `xl` where there is room. Below `lg` the shot is a band at the foot and
          the copy has the full width. */}
      <div className="relative flex h-full min-h-[300px] items-start px-12 pb-16 pt-10 sm:px-14 sm:pb-14 lg:items-center lg:px-12 lg:pb-12 xl:px-[72px]">
        <div className="max-w-[300px] sm:max-w-[480px] lg:max-w-[352px] xl:max-w-[430px]">
          <p className="kicker text-plum-700">Supplements</p>
          <h1
            id={active ? "hero-heading" : undefined}
            className="mt-2.5 text-balance text-[29px] leading-[1.04] text-plum-900 sm:text-[40px] lg:text-[35px] xl:text-[44px]"
          >
            Vitamins, minerals and daily essentials
          </h1>
          <p className="mt-4 text-[14.5px] text-muted" data-num>
            {stats.products} products · {stats.brands} brands · {stats.shelves} shelves
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ShopButton href="/c/vitamins" tone="plum">
              Shop All
            </ShopButton>
            <Link
              href="/#shelf"
              className="text-[13.5px] font-medium text-plum-800 underline-offset-4 hover:text-plum-900 hover:underline"
            >
              Browse all shelves
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 2: medical equipment ──────────────────────────────────────────────────────────── */

/**
 * The blue field is this slide's own background now rather than a layer shared with the frame,
 * and the vignette with it.
 */
function EquipmentSlide({ ranges, active }: { ranges: EquipmentRange[]; active: boolean }) {
  return (
    <div className="relative h-full">
      <div className="banner-clinic pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.16),transparent_62%)]"
        aria-hidden
      />
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
            <ShopButton href="/equipment" tone="white">
              Shop Now
            </ShopButton>
          </div>
        </div>

        {/* Examples: the four ranges. */}
        <ul className={GRID}>
          {ranges.map((range) => (
            <li key={range.name} className={TILE}>
              <div
                className={`${SHOT} flex items-center justify-center !bg-clinic-100 text-clinic-700`}
              >
                <EquipmentGlyph
                  range={range.glyph}
                  className="h-[58px] w-[58px] lg:h-[62px] lg:w-[62px] xl:h-[76px] xl:w-[76px]"
                />
              </div>
              <p className="mt-2 text-[12.5px] font-medium leading-snug text-white">{range.name}</p>
              <p className="facts mt-1 !text-white/70">{range.spec}</p>
            </li>
          ))}
        </ul>
      </SlideFrame>
    </div>
  );
}
