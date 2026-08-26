import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { count, price } from "@/lib/format";
import { Rating } from "@/components/product/rating";
import { QuickAdd } from "@/components/cart/quick-add";

/**
 * Product card. Kept to five reads — image, brand, name, rating, price — with the facts
 * strip carrying the comparison data.
 *
 * The whole card is one link: a single absolutely-positioned anchor covers it, the way the
 * reference site does it, so text stays selectable and there is one tab stop per product
 * instead of three. Add to cart is layered above that overlay and only appears on hover.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col rounded-card border border-line bg-white p-3 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_10px_30px_-22px_rgba(43,15,32,0.5)]">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-[7px] bg-paper">
        <Image
          src={product.image}
          alt={`${product.brand} ${product.title}`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 250px"
          priority={priority}
          className="object-contain p-2"
        />
        {product.discount && (
          <span className="kicker absolute left-0 top-0 z-10 rounded-br-[7px] bg-plum-800 px-2 py-1 text-turmeric-200">
            −{product.discount}%
          </span>
        )}

        {/* Sits over the foot of the image, where product photography is empty anyway. */}
        <div className="absolute inset-x-2 bottom-2 z-20">
          <QuickAdd slug={product.slug} variant="reveal" />
        </div>
      </div>

      <p className="facts truncate text-plum-700">{product.brand}</p>
      <h3 className="mt-0.5 line-clamp-2 min-h-[38px] font-sans text-[13.5px] font-medium leading-snug tracking-normal text-ink">
        <Link
          href={`/p/${product.slug}`}
          aria-label={`${product.brand} ${product.title}`}
          className="static before:absolute before:inset-0 before:z-10"
        >
          {product.title}
        </Link>
      </h3>

      <div className="mt-1.5">
        <Rating value={product.rating} reviews={product.reviews} />
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-[17px] font-semibold ${product.discount ? "text-sale-600" : "text-ink"}`}
            data-num
          >
            {price(product.price)}
          </span>
          {product.listPrice && (
            <span className="facts line-through" data-num>
              {price(product.listPrice)}
            </span>
          )}
        </div>

        {/* Fixed height whether or not there is a volume figure, so rows stay aligned. */}
        <p className="facts mt-1 h-[16px] font-medium" data-num>
          {product.sold30d ? `${count(product.sold30d)} bought this month` : ""}
        </p>
      </div>
    </article>
  );
}
