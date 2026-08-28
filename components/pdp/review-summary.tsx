import type { Product } from "@/lib/catalog";
import { reviewCount } from "@/lib/format";
import type { ReviewSummary as CustomerSummary } from "@/lib/reviews";
import { StarIcon } from "@/components/ui/icons";
import { Stars } from "@/components/ui/stars";

/*
  Two ratings, side by side, never averaged into one.

  On the left is the figure this product carries in the catalogue — a real number, collected for
  this product, and not ours to recompute. On the right is what people have written here: a real
  average over real rows, with a real per-star distribution.

  Blending them would produce a number that no source states and that we could not show the
  working for, which is the one thing this codebase does not do. The bars used to be shaped from
  the left-hand average by `ratingBreakdown()`; that function is gone, and a product nobody has
  reviewed here yet shows no bars at all rather than invented ones.
*/
export function ReviewSummary({
  product,
  customers,
}: {
  product: Product;
  customers: CustomerSummary;
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:gap-10">
      <div>
        <p className="kicker mb-2 text-muted">Product rating</p>
        <p className="font-display text-[40px] leading-none" data-num>
          {product.rating.toFixed(1)}
        </p>
        <Stars value={product.rating} className="mt-2" />
        <p className="facts mt-1.5" data-num>
          Based on {reviewCount(product.reviews)} ratings collected for this product
        </p>
      </div>

      <div className="sm:border-l sm:border-line sm:pl-10">
        <p className="kicker mb-2 text-muted">Reviews on Slim Wellness Asia</p>

        {customers.count === 0 || customers.average === null ? (
          <p className="max-w-[44ch] text-sm text-muted">
            Nobody has reviewed this here yet. The form is below.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-display text-[26px] leading-none" data-num>
                {customers.average.toFixed(1)}
              </span>
              <Stars value={customers.average} size="sm" />
              <span className="facts" data-num>
                {customers.count} {customers.count === 1 ? "review" : "reviews"}
              </span>
            </div>

            <ul className="mt-4 max-w-[420px] space-y-1.5">
              {customers.buckets.map((bucket) => (
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
                  <span className="facts w-7 shrink-0 text-right" data-num>
                    {bucket.count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
