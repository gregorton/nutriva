import Link from "next/link";
import { ArrowIcon, FlaskIcon, LeafIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";

/**
 * The standard — one banner rather than a full-width statistics band. A dark panel holds
 * the claim, and four white cards underneath carry the specifics, each with the figure that
 * backs it.
 */
const POINTS = [
  {
    Icon: FlaskIcon,
    value: "2 lab panels",
    detail: "Identity and contaminants, run per lot by separate labs",
  },
  {
    Icon: LeafIcon,
    value: "±10% label accuracy",
    detail: "Actives verified against the dose printed on the bottle",
  },
  {
    Icon: TruckIcon,
    value: "24h in Bangkok",
    detail: "Next-day across the metro, 2–4 days upcountry",
  },
  {
    Icon: ShieldIcon,
    value: "60-day returns",
    detail: "Opened bottles included, no questions asked",
  },
];

export function TrustBand() {
  return (
    <section className="shell mt-14">
      <div className="overflow-hidden rounded-tile bg-plum-800 p-6 sm:p-8">
        <div className="relative">
          {/* Same soft wash as the hero, so the two dark panels read as one family. */}
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-turmeric-500/15 blur-2xl"
            aria-hidden
          />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="kicker text-turmeric-200">The standard</p>
              <h2 className="mt-2 text-[22px] text-white sm:text-[26px]">
                A supplement is only as good as its paperwork
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-plum-200">
                Every batch is tested before it reaches the shelf, and the results are published with it.
              </p>
            </div>

            <Link
              href="/quality"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-plum-800 transition-colors hover:bg-turmeric-200"
            >
              Read the standard
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          <ul className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {POINTS.map(({ Icon, value, detail }) => (
              <li key={value} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pandan-100 text-pandan-700">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold leading-tight text-ink" data-num>
                    {value}
                  </p>
                  <p className="facts mt-0.5 leading-snug">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
