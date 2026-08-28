"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { EquipmentGlyph } from "@/components/home/equipment-glyphs";
import type { HeroCta, RangeSlide, ShelfSlide } from "@/components/home/hero-slides";

/**
 * The home hero: two tabs in one 21:9 banner frame, each holding its own slideshow. Supplements is
 * photo-led — the flat-lay is the whole field, and the copy and its button sit in the empty half of
 * the shot, the way a printed banner works. Medical equipment keeps the Professional brands blue,
 * one range to a slide.
 *
 * **The pill switches topic and the arrows move within it.** The arrows used to switch topic too:
 * with one slide each there was nothing else for them to do, so the right arrow on Supplements
 * landed the shopper on a blue field about nebulisers, and each arrow disabled itself the moment it
 * fired — which hands keyboard focus back to the document. Now neither arrow ever crosses from one
 * topic to the other, and both stay live because the slideshow wraps.
 *
 * **Two nested tracks, not one flat track of every slide.** Flat, a tab switch would animate
 * through the intervening slides. Nested, the outer track moves between topics and each panel's
 * inner track moves within one, and every tab keeps its own position — come back to Supplements and
 * you are on the slide you left.
 *
 * Each slide owns its background. The supplements side used to run the `banner-plum` ramp, so the
 * two fields were stacked layers cross-fading their opacity (a gradient cannot be transitioned
 * directly); with a photograph on one side there is nothing left to cross-fade.
 */

export function HeroCarousel({
  supplements,
  equipment,
}: {
  supplements: ShelfSlide[];
  equipment: RangeSlide[];
}) {
  const [tab, setTab] = useState(0);
  // One position per tab, so switching topic never disturbs where the other one was left.
  const [positions, setPositions] = useState([0, 0]);

  const onEquipment = tab === 1;
  const headings = (onEquipment ? equipment : supplements).map((slide) => slide.heading);
  const count = Math.max(1, headings.length);
  const position = Math.min(positions[tab], count - 1);

  // Wraps, so neither arrow is ever spent and neither has to disable itself mid-press.
  const move = (next: number) =>
    setPositions((prev) => prev.map((p, index) => (index === tab ? (next + count) % count : p)));

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
        {/* Topic track. Both panels stay mounted so the height is stable; the one off-screen is
            inert, which takes it out of the tab order and off the accessibility tree. `h-full` is
            what hands the frame's 21:9 height down through the panels to the slides. */}
        <div
          className="relative flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${tab * 100}%)` }}
        >
          <Panel id="hero-panel-supplements" off={onEquipment} position={positions[0]}>
            {supplements.map((slide, index) => (
              <Slide
                key={slide.id}
                index={index}
                count={supplements.length}
                current={index === positions[0]}
              >
                <SupplementsSlide
                  slide={slide}
                  first={index === 0}
                  active={!onEquipment && index === positions[0]}
                />
              </Slide>
            ))}
          </Panel>

          <Panel id="hero-panel-equipment" off={!onEquipment} position={positions[1]}>
            {equipment.map((slide, index) => (
              <Slide
                key={slide.id}
                index={index}
                count={equipment.length}
                current={index === positions[1]}
              >
                <EquipmentSlide slide={slide} active={onEquipment && index === positions[1]} />
              </Slide>
            ))}
          </Panel>
        </div>

        {/* Edge arrows — within the tab you are on, and never across to the other one. */}
        {count > 1 ? (
          <>
            <NavArrow direction="prev" onClick={() => move(position - 1)} />
            <NavArrow direction="next" onClick={() => move(position + 1)} />
          </>
        ) : null}

        {/* One control cluster: the topic, then where you are inside it. Labelled tabs rather than
            dots, because with two topics the label is the useful information. Left-aligned with the
            copy above it rather than centred — centred it lands on the middle of the flat-lay and
            covers the thing the banner is showing. The pill is plum at 70% rather than black at
            25%: it has to hold white type over a near-white photograph as well as over the blue
            field. The strip itself takes no clicks, or it would eat presses along the whole foot of
            the banner. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start pb-3.5 pl-12 sm:pl-14 xl:pl-[72px]">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-plum-900/70 p-1 backdrop-blur-sm">
            {TABS.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(index)}
                aria-pressed={tab === index}
                aria-controls={`hero-panel-${entry.id}`}
                aria-label={entry.label}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  tab === index ? "bg-white text-ink" : "text-white/80 hover:text-white"
                }`}
              >
                <span className="sm:hidden">{entry.short}</span>
                <span className="hidden sm:inline">{entry.label}</span>
              </button>
            ))}

            {count > 1 ? (
              <>
                <span className="mx-0.5 h-4 w-px shrink-0 bg-white/25" aria-hidden />
                <div className="flex items-center pr-1">
                  {headings.map((heading, index) => (
                    <button
                      key={heading}
                      type="button"
                      onClick={() => move(index)}
                      aria-current={index === position}
                      aria-label={`Slide ${index + 1} of ${count}: ${heading}`}
                      className="grid h-6 w-4 place-items-center"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          index === position ? "bg-white" : "bg-white/45"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The two topics. `short` is what the phone shows: the pill holds the dots as well, and at 375px
 * "Medical equipment" and four dots do not fit on one line — the label wrapped to two. The button's
 * `aria-label` stays the full name either way, so the accessible name does not change with the
 * viewport.
 */
const TABS = [
  { id: "supplements", label: "Supplements", short: "Supplements" },
  { id: "equipment", label: "Medical equipment", short: "Equipment" },
] as const;

/* ── Tracks ──────────────────────────────────────────────────────────────────────────────── */

/**
 * One topic: its own slide track, clipped to the frame so its slides move independently of the
 * topic track above it. `off` marks the topic you are not looking at.
 */
function Panel({
  id,
  off,
  position,
  children,
}: {
  id: string;
  off: boolean;
  position: number;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="w-full shrink-0 overflow-hidden" inert={off}>
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${position * 100}%)` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * One slide in a panel. Every slide stays mounted so the panel's height is stable, and the ones
 * off-screen are inert — otherwise their CTAs are tab stops for a slide nobody can see.
 */
function Slide({
  index,
  count,
  current,
  children,
}: {
  index: number;
  count: number;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full shrink-0"
      inert={!current}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}`}
    >
      {children}
    </div>
  );
}

function NavArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "next" ? "Next slide" : "Previous slide"}
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-plum-900 ring-1 ring-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.22)] transition hover:bg-paper sm:h-11 sm:w-11 ${
        direction === "next" ? "right-2 sm:right-3" : "left-2 sm:left-3"
      }`}
    >
      <ArrowIcon className={`h-5 w-5 ${direction === "prev" ? "rotate-180" : ""}`} />
    </button>
  );
}

/* ── Slide shell ─────────────────────────────────────────────────────────────────────────── */

/**
 * Frame for an equipment slide. Padding clears the edge arrows at every width, and `h-full` lets
 * the range centre in the banner rather than sitting at the top of it. The supplements slides carry
 * their own frame — one column of copy over a full-bleed photograph.
 */
function SlideFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-full grid-cols-1 items-center gap-7 px-12 pb-16 pt-8 sm:px-14 sm:pb-14 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-10 lg:px-[72px] lg:pb-8 lg:pt-6 xl:pb-12 xl:pt-8">
      {children}
    </div>
  );
}

/**
 * The one button on a slide, in the two tones the two fields need: plum fill on the light
 * photograph (the site's primary button everywhere else it sits on white), white fill on the blue
 * field. Never `btn-cart` — that gradient is add-to-cart and nothing else.
 */
const CTA_TONE = {
  plum: "bg-plum-800 text-white shadow-[0_2px_14px_rgba(43,15,32,0.24)] hover:bg-plum-700",
  white: "bg-white text-ink shadow-[0_2px_14px_rgba(0,0,0,0.22)] hover:bg-paper",
} as const;

function ShopButton({ cta, tone }: { cta: HeroCta; tone: keyof typeof CTA_TONE }) {
  return (
    <Link
      href={cta.href}
      className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition ${CTA_TONE[tone]}`}
    >
      {cta.label}
      <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ── Supplements: one shelf to a slide ───────────────────────────────────────────────────── */

/**
 * Photo-led, and the photograph is the banner: the flat-lay was shot with its left half empty, so
 * the copy and the button go in that empty half and no scrim is needed to hold them apart from the
 * subject. Dark type on the wood, plum button, one cross-link on the opening slide.
 *
 * A slide with no shot of its own shows the flat-lay — the server half resolves that, so the arrow
 * currently advances the shelf, the figures and the button over one photograph. Dropping
 * `public/hero/<name>.png` in gives that shelf its own field with no code change.
 */
function SupplementsSlide({
  slide,
  first,
  active,
}: {
  slide: ShelfSlide;
  /** the opening slide: the page's `h1`, and the only photograph worth preloading */
  first: boolean;
  active: boolean;
}) {
  const Heading = first ? "h1" : "h2";

  return (
    <div className="relative h-full">
      {slide.photo ? (
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
              src={slide.photo}
              alt=""
              fill
              priority={first}
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
          <Heading
            id={active ? "hero-heading" : undefined}
            className="mt-2.5 text-balance text-[29px] leading-[1.04] text-plum-900 sm:text-[40px] lg:text-[35px] xl:text-[44px]"
          >
            {slide.heading}
          </Heading>
          {slide.blurb ? (
            <p className="mt-3.5 text-balance text-[14.5px] text-plum-900/75">{slide.blurb}</p>
          ) : null}
          <p className={`text-[14.5px] text-muted ${slide.blurb ? "mt-1.5" : "mt-4"}`} data-num>
            {slide.figures}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ShopButton cta={slide.cta} tone="plum" />
            {slide.link ? (
              <Link
                href={slide.link.href}
                className="text-[13.5px] font-medium text-plum-800 underline-offset-4 hover:text-plum-900 hover:underline"
              >
                {slide.link.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Medical equipment: one range to a slide ─────────────────────────────────────────────── */

/**
 * The blue field is this slide's own background rather than a layer shared with the frame, and the
 * vignette with it. One range at a time: the four-tile grid this replaced put every range on every
 * slide, so the arrow had nothing to change but the heading. The glyph plate is glass, so the field
 * reads through it, with the pale `clinic-100` tile inside for the line art to sit on. It shrinks
 * between `lg` and `xl` rather than growing: that is the range where 21:9 is at its shortest —
 * 425px at a 1024 viewport.
 */
function EquipmentSlide({ slide, active }: { slide: RangeSlide; active: boolean }) {
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
            {slide.heading}
          </h2>
          <p className="mt-3.5 text-[14.5px] text-white/85">{slide.spec}</p>
          <p className="mt-1.5 text-[12.5px] text-white/60" data-num>
            {slide.figures}
          </p>

          <div className="mt-7">
            <ShopButton cta={slide.cta} tone="white" />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex h-[132px] w-[132px] items-center justify-center rounded-tile bg-white/12 ring-1 ring-inset ring-white/25 shadow-[0_2px_14px_rgba(0,0,0,0.18)] backdrop-blur-md sm:h-[176px] sm:w-[176px] lg:h-[196px] lg:w-[196px] xl:h-[264px] xl:w-[264px]">
            <div className="flex h-[76%] w-[76%] items-center justify-center rounded-[10px] bg-clinic-100 text-clinic-700">
              <EquipmentGlyph range={slide.glyph} className="h-[64%] w-[64%]" />
            </div>
          </div>
        </div>
      </SlideFrame>
    </div>
  );
}
