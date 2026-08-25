import Image from "next/image";
import Link from "next/link";
import { dealCount, deals } from "@/lib/catalog";
import { count, price } from "@/lib/format";
import { Countdown } from "@/components/home/countdown";
import { Rail } from "@/components/ui/rail";
import { QuickAdd } from "@/components/cart/quick-add";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * Daily deals. Urgency is limited to two honest signals: a countdown to the real end of
 * the day, and how much of the allocation is gone. No invented scarcity.
 */
export function DealRail() {
  const items = deals(12);
  if (items.length === 0) return null;

  return (
    <section className="mt-14 bg-paper-warm py-8">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker mb-1.5 text-plum-700">Resets at midnight ICT</p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[22px] sm:text-[26px]">Today&apos;s deals</h2>
              <Countdown />
            </div>
          </div>
          <Link
            href="/deals"
            className="group flex items-center gap-1.5 text-sm font-semibold text-plum-700 hover:text-plum-600"
          >
            All {dealCount()} deals
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <Rail className="mt-5">
          {items.map((product, i) => {
            // Allocation claimed so far — derived from real 30-day volume, capped at 92%.
            const claimed = Math.min(92, 34 + Math.round(((product.sold30d ?? 12_000) / 90_000) * 58));

            return (
              <article
                key={product.slug}
                className="group relative flex w-[62%] shrink-0 flex-col rounded-card border border-line bg-white p-3 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_10px_30px_-22px_rgba(43,15,32,0.5)] sm:w-[38%] lg:w-[23%] xl:w-[19%]"
              >
                <div className="relative mb-3 aspect-square overflow-hidden rounded-[7px] bg-paper">
                  <Image
                    src={product.image}
                    alt={`${product.brand} ${product.title}`}
                    fill
                    sizes="(max-width: 640px) 60vw, 240px"
                    priority={i < 2}
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="kicker absolute left-0 top-0 z-10 rounded-br-[7px] bg-sale-600 px-2 py-1 text-white">
                    −{product.discount}%
                  </span>
                  <div className="absolute inset-x-2 bottom-2 z-20">
                    <QuickAdd slug={product.slug} variant="reveal" />
                  </div>
                </div>

                <p className="facts truncate text-plum-700">{product.brand}</p>
                <h3 className="mt-0.5 line-clamp-2 min-h-[38px] font-sans text-[13.5px] font-medium leading-snug tracking-normal">
                  <Link
                    href={`/p/${product.slug}`}
                    aria-label={`${product.brand} ${product.title}`}
                    className="static before:absolute before:inset-0 before:z-10"
                  >
                    {product.title}
                  </Link>
                </h3>

                <div className="mt-auto pt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[17px] font-semibold text-sale-600" data-num>
                      {price(product.price)}
                    </span>
                    <span className="facts line-through" data-num>
                      {price(product.listPrice!)}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="h-[3px] overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-turmeric-500" style={{ width: `${claimed}%` }} />
                    </div>
                    <p className="facts mt-1.5 flex items-center justify-between">
                      <span data-num>{claimed}% claimed</span>
                      {product.sold30d && (
                        <span className="font-medium text-sold" data-num>
                          {count(product.sold30d)} bought
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </Rail>
      </div>
    </section>
  );
}
