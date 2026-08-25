import Image from "next/image";
import Link from "next/link";
import { GOALS, bestSellers, deals } from "@/lib/catalog";
import { price } from "@/lib/format";
import { ArrowIcon } from "@/components/ui/icons";
import { Rating } from "@/components/product/rating";
import type { Product } from "@/lib/catalog";

/**
 * Hero as thesis: the promise is that you can read the test results, so the panel leads
 * with a goal picker rather than a discount banner. Keeps the reference's
 * one-large-plus-stacked-tiles structure so the page still scans as a shop.
 */
export function GoalHero() {
  const [mostBought] = bestSellers(1);
  const [bestSaving] = deals(1);

  return (
    <section className="shell grid gap-3 pt-6 lg:grid-cols-[1.55fr_1fr]">
      <div className="relative overflow-hidden rounded-tile bg-plum-800 px-6 py-8 text-white sm:px-10 sm:py-12">
        {/* Botanical wash — one soft shape, no photography, so the type carries the panel. */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-turmeric-500/15 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-pandan-600/25 blur-2xl"
          aria-hidden
        />

        <div className="relative max-w-xl">
          <p className="kicker text-turmeric-200">Every lot, tested twice</p>
          <h1 className="mt-3 text-[34px] leading-[1.05] sm:text-[46px]">
            Know what is in the bottle
            <span className="block text-turmeric-200">before you swallow it.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-plum-200">
            Independent lab results published for every batch we ship. Start with what you are trying to
            fix.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {GOALS.map((goal) => (
              <li key={goal.slug}>
                <Link
                  href={`/c/${goal.category}`}
                  className="group flex items-center gap-2 rounded-full border border-plum-600 bg-plum-900/40 py-2 pl-3.5 pr-3 text-[13.5px] font-medium text-white transition-colors hover:border-turmeric-500 hover:bg-plum-700"
                >
                  {goal.label}
                  <ArrowIcon className="h-3.5 w-3.5 text-turmeric-200 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {mostBought && <HeroProduct product={mostBought} kicker="Most bought this month" priority />}
        {bestSaving && bestSaving.slug !== mostBought?.slug && (
          <HeroProduct product={bestSaving} kicker={`Biggest saving today · −${bestSaving.discount}%`} />
        )}
      </div>
    </section>
  );
}

function HeroProduct({
  product,
  kicker,
  priority = false,
}: {
  product: Product;
  kicker: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex flex-1 items-center gap-4 rounded-tile border border-line bg-white p-4 transition-colors hover:border-line-strong"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[7px] bg-paper">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="96px"
          priority={priority}
          className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0">
        <p className="kicker text-muted">{kicker}</p>
        <p className="facts mt-1.5 text-plum-700">{product.brand}</p>
        <h2 className="line-clamp-2 font-sans text-sm font-medium tracking-normal">{product.title}</h2>
        <div className="mt-1.5">
          <Rating value={product.rating} reviews={product.reviews} />
        </div>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span
            className={`text-[15px] font-semibold ${product.discount ? "text-sale-600" : "text-ink"}`}
            data-num
          >
            {price(product.price)}
          </span>
          {product.listPrice && (
            <span className="facts line-through" data-num>
              {price(product.listPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
