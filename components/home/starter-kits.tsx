import Link from "next/link";
import { KITS } from "@/lib/starters";
import { KitTile } from "@/components/starters/kit-card";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * Home band, in the slot Today's deals used to hold — the one place on the page that gets read
 * before the catalogue starts. Kits earn it better than a markdown carousel did: a first-time
 * buyer's problem is not price, it is not knowing which three bottles to start with.
 *
 * Ordering is `KITS` order, which is the 30-day volume of what is in each kit, so the first tile
 * is the one the stock says people actually buy.
 */
export function StarterKits() {
  if (KITS.length === 0) return null;

  return (
    <section className="mt-14 bg-paper-warm py-8">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker mb-1.5 text-plum-700">Picked for a first shelf · 16 and up</p>
            <h2 className="text-[22px] sm:text-[26px]">Starter kits</h2>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-snug text-muted">
              Two or three bottles that go together, at what they cost separately — no bundle
              maths, no subscription. Every kit says what it leaves out and why.
            </p>
          </div>
          <Link
            href="/starters"
            className="group flex items-center gap-1.5 text-sm font-semibold text-plum-700 hover:text-plum-600"
          >
            All {KITS.length} kits
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KITS.map((kit, i) => (
            <li key={kit.slug}>
              <KitTile kit={kit} priority={i < 2} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
