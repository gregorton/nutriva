import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";
import { EQUIPMENT_RANGES, EquipmentGlyph } from "@/components/home/equipment-glyphs";

export const metadata: Metadata = {
  title: "Medical equipment",
  description:
    "Home monitoring and respiratory equipment, opening soon at Nutriva — specified off the box, with no clinical claims attached.",
};

/*
  Where the hero's medical-equipment slide lands.

  There is no equipment catalogue behind this yet, and the page says so in the first line rather
  than dressing four ranges up as a shelf. It states what will be listed, on what terms, and what
  will not be claimed — the same rules the supplement shelf already runs on.
*/

/** Specs each range will be listed on, worded as the box words them. */
const LISTED = [
  ["Blood pressure monitors", "Cuff circumference, measurement range, accuracy tolerance, memory slots, power source."],
  ["Thermometers", "Measurement site, range and stated tolerance, response time, whether a probe cover is required."],
  ["Pulse oximeters", "SpO₂ and pulse-rate range with the manufacturer's stated accuracy, display type, battery life."],
  ["Nebulisers", "Particle size, nebulisation rate, cup capacity, noise level, mask sizes in the box."],
] as const;

const RULES = [
  "Specifications quoted from the manufacturer's box and manual, with the model number beside them.",
  "Regulatory marks reproduced only where the packaging carries them.",
  "Warranty and included accessories listed as stated, or left blank when they are not.",
];

const NOT_DOING = [
  "No diagnostic or treatment claims. A monitor reads a number; what the number means is between you and a clinician.",
  "No accuracy figure of our own — we run no laboratory and calibrate nothing.",
  "No prescription devices, and nothing sized for infants.",
];

export default function EquipmentPage() {
  return (
    <div>
      <div className="shell pt-6">
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Medical equipment" }]} />
      </div>

      {/* Same banner ramp as the hero's second slide and the Professional brands band. */}
      <section className="shell mt-3">
        <div className="banner-clinic relative overflow-hidden rounded-tile px-6 py-10 sm:px-10 sm:py-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.16),transparent_62%)]"
            aria-hidden
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,62ch)_minmax(0,1fr)]">
            <div>
              <p className="kicker text-white/70">Opening soon</p>
              <h1 className="mt-2 text-[30px] leading-[1.06] text-white sm:text-[38px]">
                Medical equipment
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-white/85">
                Nothing here is on sale yet. Nutriva sells supplements today; home monitoring and
                respiratory equipment is the next shelf, and this page is what we have committed to
                before a single unit is listed.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href="/c/vitamins"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ink shadow-[0_2px_14px_rgba(0,0,0,0.22)] transition hover:bg-paper"
                >
                  Shop supplements instead
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/guides"
                  className="text-[13.5px] font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
                >
                  Read the label guides
                </Link>
              </div>
            </div>

            {/* The four ranges as marks — the same glyphs the home hero uses. */}
            <ul className="hidden justify-end gap-3 lg:flex" aria-hidden>
              {EQUIPMENT_RANGES.map((range) => (
                <li
                  key={range.name}
                  className="flex h-[92px] w-[92px] items-center justify-center rounded-tile bg-white/10 text-white/80 ring-1 ring-inset ring-white/15"
                >
                  <EquipmentGlyph range={range.glyph} className="h-14 w-14" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="shell pb-4">
        <section className="mt-12">
          <p className="kicker text-muted">{EQUIPMENT_RANGES.length} ranges at launch</p>
          <h2 className="mt-1.5 text-[22px] sm:text-[26px]">What we are opening with</h2>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {LISTED.map(([name, spec]) => {
              const range = EQUIPMENT_RANGES.find((item) => item.name === name);

              return (
                <li
                  key={name}
                  className="flex gap-4 rounded-card border border-line bg-white p-5"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[9px] bg-clinic-100 text-clinic-700">
                    {range && <EquipmentGlyph range={range.glyph} className="h-11 w-11" />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-sans text-[15px] font-semibold tracking-normal text-ink">{name}</h3>
                    {range && <p className="facts mt-0.5 text-clinic-700">{range.spec}</p>}
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                      Listed on: {spec}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-line bg-paper p-6">
            <h2 className="text-[19px]">How a device will be listed</h2>
            <ul className="mt-4 space-y-3">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-clinic-700" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <p className="facts mt-4">
              A figure the box does not state stays blank, exactly as it does on a supplement page.
            </p>
          </div>

          <div className="rounded-card border border-line bg-white p-6" id="what-we-wont-do">
            <h2 className="text-[19px]">What we won&apos;t do</h2>
            <ul className="mt-4 space-y-3">
              {NOT_DOING.map((line) => (
                <li key={line} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sale-600" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="facts mt-10 max-w-[80ch]">
          Nutriva is a retailer, not a healthcare provider. Nothing on this page is medical advice,
          and no device sold here is a substitute for assessment by a clinician.
        </p>
      </div>
    </div>
  );
}
