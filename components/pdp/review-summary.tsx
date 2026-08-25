import type { Product } from "@/lib/catalog";
import { reviewCount } from "@/lib/format";
import { ratingBreakdown } from "@/lib/product-info";
import { StarIcon } from "@/components/ui/icons";
import { Stars } from "@/components/ui/stars";

/*
  Rating summary with the reference site's distribution bars — average and stars on the left,
  a bar per star bucket on the right. The bars are plum, where the reference runs green.

  The distribution is derived from the rating (see `ratingBreakdown`) because this catalog's
  ratings are placeholders themselves; the note under the block says so rather than letting the
  chart imply review data we do not have.
*/
export function ReviewSummary({ product }: { product: Product }) {
  const buckets = ratingBreakdown(product);

  return (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <div>
        <p className="font-display text-[40px] leading-none" data-num>
          {product.rating.toFixed(1)}
        </p>
        <Stars value={product.rating} className="mt-2" />
        <p className="facts mt-1.5" data-num>
          Based on {reviewCount(product.reviews)} ratings
        </p>
      </div>

      <ul className="w-full min-w-[240px] max-w-[420px] flex-1 space-y-1.5">
        {buckets.map((bucket) => (
          <li key={bucket.stars} className="flex items-center gap-2.5">
            <span className="facts flex w-8 shrink-0 items-center gap-1 font-medium text-ink" data-num>
              {bucket.stars}
              <StarIcon className="h-3.5 w-3.5 text-star" />
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-plum-700"
                style={{ width: `${bucket.percent}%` }}
              />
            </span>
            <span className="facts w-9 shrink-0 text-right" data-num>
              {bucket.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
