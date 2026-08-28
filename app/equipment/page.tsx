import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon } from "@/components/ui/icons";
import { EQUIPMENT_RANGES, EquipmentGlyph } from "@/components/home/equipment-glyphs";

export const metadata: Metadata = {
  title: "Medical equipment",
  description: "Home monitoring and respiratory equipment, opening soon at Slim Wellness Asia.",
};

/* Where the hero's medical-equipment slide lands. No catalogue behind it yet. */
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
          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,52ch)_minmax(0,1fr)]">
            <div>
              <p className="kicker text-white/70">Opening soon</p>
              <h1 className="mt-2 text-[30px] leading-[1.06] text-white sm:text-[38px]">
                Medical equipment
              </h1>
              <p className="mt-4 text-[15px] text-white/85">
                Home monitoring and respiratory equipment, next on the shelf.
              </p>
              <div className="mt-6">
                <Link
                  href="/c/vitamins"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ink shadow-[0_2px_14px_rgba(0,0,0,0.22)] transition hover:bg-paper"
                >
                  Shop supplements
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

      <section className="shell mt-12 pb-6">
        <p className="kicker text-muted" data-num>
          {EQUIPMENT_RANGES.length} ranges
        </p>
        <h2 className="mt-1.5 text-[22px] sm:text-[26px]">What we&apos;re opening with</h2>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EQUIPMENT_RANGES.map((range) => (
            <li
              key={range.name}
              className="flex flex-col items-start rounded-card border border-line bg-white p-5"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-[9px] bg-clinic-100 text-clinic-700">
                <EquipmentGlyph range={range.glyph} className="h-12 w-12" />
              </span>
              <h3 className="mt-3 font-sans text-[15px] font-semibold tracking-normal text-ink">
                {range.name}
              </h3>
              <p className="facts mt-1">{range.spec}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
