import Image from "next/image";
import Link from "next/link";
import type { Kit } from "@/lib/starters";
import { getGuide } from "@/lib/guides";
import { price } from "@/lib/format";
import { AddKit } from "@/components/starters/add-kit";
import { ArrowIcon } from "@/components/ui/icons";

/*
  A kit, in two sizes: the full card on /starters and the tile in the home band.

  Both print the same three numbers and no others — real total, how long the shortest pack lasts,
  and a markdown only where every item in the kit actually carries one. There is no bundle
  discount, so neither card implies one: the total is what these products cost separately, and
  the reason to buy the kit is that someone chose the three bottles for you.
*/

function Figures({ kit }: { kit: Kit }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-[19px] font-semibold text-ink" data-num>
        {price(kit.total)}
      </span>
      {kit.saving !== null && kit.listTotal !== null && (
        <>
          <span className="facts line-through" data-num>
            {price(kit.listTotal)}
          </span>
          <span className="facts font-medium text-pandan-600" data-num>
            save {price(kit.saving)}
          </span>
        </>
      )}
      {kit.days && (
        <span className="facts" data-num>
          shortest pack: {kit.days} days
        </span>
      )}
    </div>
  );
}

/** Full card: every item listed with its role, price and pack size, plus one-press add. */
export function KitCard({ kit }: { kit: Kit }) {
  const guides = kit.guides.map(getGuide).filter((g): g is NonNullable<typeof g> => !!g);

  return (
    <section
      className="flex h-full flex-col rounded-tile border border-line bg-white p-5"
      aria-label={kit.title}
    >
      <p className="kicker text-plum-700">{kit.eyebrow}</p>
      <h3 className="mt-1.5 font-display text-[21px] leading-tight sm:text-[23px]">{kit.title}</h3>
      <p className="mt-2 text-[13.5px] leading-snug text-muted">{kit.promise}</p>

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {kit.items.map(({ role, product }) => (
          <li key={product.slug} className="group flex items-center gap-3 py-3">
            <Link
              href={`/p/${product.slug}`}
              tabIndex={-1}
              aria-hidden
              className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[7px] border border-line bg-paper"
            >
              <Image src={product.image} alt="" fill sizes="52px" className="object-contain p-1" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="kicker text-turmeric-700">{role}</p>
              <p className="mt-0.5 truncate text-[13px] font-medium text-ink">
                <Link href={`/p/${product.slug}`} className="hover:text-plum-700 hover:underline">
                  {product.brand} {product.title}
                </Link>
              </p>
              <p className="facts mt-0.5" data-num>
                {product.servings ? `${product.servings} servings` : product.packQuantity}
              </p>
            </div>

            <span className="facts shrink-0 font-medium text-ink" data-num>
              {price(product.price)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Figures kit={kit} />
      </div>

      <div className="mt-auto pt-4">
        <AddKit slugs={kit.items.map((i) => i.product.slug)} total={kit.total} />
        {guides.length > 0 && (
          <p className="facts mt-3">
            Read first:{" "}
            {guides.map((guide, i) => (
              <span key={guide.slug}>
                {i > 0 && ", "}
                <Link href={`/guides/${guide.slug}`} className="text-plum-700 hover:underline">
                  {guide.tag.toLowerCase()}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

/** Home tile: the same numbers, the items as a row of thumbnails, one link to the shelf. */
export function KitTile({ kit, priority = false }: { kit: Kit; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_10px_30px_-22px_rgba(43,15,32,0.5)]">
      {/* Fixed row height rather than square thumbnails: a two-item kit and a three-item kit
          have to line up across the band, and squares make the pair-kits' bottles bigger. */}
      <div className="flex h-[104px] gap-2">
        {kit.items.map(({ product }) => (
          <div
            key={product.slug}
            className="relative h-full flex-1 overflow-hidden rounded-[7px] bg-paper"
          >
            <Image
              src={product.image}
              alt=""
              fill
              sizes="(max-width: 640px) 30vw, 110px"
              priority={priority}
              className="object-contain p-1.5"
            />
          </div>
        ))}
      </div>

      <p className="kicker mt-3 text-plum-700">{kit.eyebrow}</p>
      <h3 className="mt-1 font-display text-[17px] leading-tight">
        <Link href="/starters" className="static before:absolute before:inset-0">
          {kit.title}
        </Link>
      </h3>
      <p className="facts mt-1.5 line-clamp-2">{kit.items.map((i) => i.role).join(" · ")}</p>

      <div className="mt-auto pt-3">
        <Figures kit={kit} />
        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-plum-700">
          See the kit
          <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </article>
  );
}
