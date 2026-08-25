import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { count, price } from "@/lib/format";
import { QuickAdd } from "@/components/cart/quick-add";
import { Stars } from "@/components/ui/stars";

/**
 * "A similar item" — the reference site's single cross-sell card in the summary column, kept to
 * one product so it reads as an alternative to consider rather than another grid to scan. The
 * rail further down the page is where breadth belongs.
 */
export function SimilarItem({ product }: { product: Product }) {
  return (
    <section className="rounded-card border border-line p-4" aria-label="A similar item">
      <h2 className="font-sans text-[15px] font-semibold tracking-normal text-ink">
        A similar item from our range
      </h2>

      <div className="mt-3 flex gap-3">
        <Link
          href={`/p/${product.slug}`}
          tabIndex={-1}
          aria-hidden
          className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[7px] border border-line bg-paper"
        >
          <Image
            src={product.image}
            alt=""
            fill
            sizes="76px"
            className="object-contain p-1.5"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="facts truncate text-plum-700">{product.brand}</p>
          <h3 className="mt-0.5 font-sans text-[13px] font-medium leading-snug tracking-normal text-ink">
            <Link href={`/p/${product.slug}`} className="line-clamp-2 hover:underline">
              {product.title}
            </Link>
          </h3>

          <p className="mt-1 flex items-center gap-1.5">
            <span className="facts font-medium text-ink" data-num>
              {product.rating.toFixed(1)}
            </span>
            <Stars value={product.rating} size="sm" />
            <span className="facts" data-num>
              ({count(product.reviews)})
            </span>
          </p>

          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
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

          <div className="mt-2 max-w-[160px]">
            <QuickAdd slug={product.slug} />
          </div>
        </div>
      </div>
    </section>
  );
}
