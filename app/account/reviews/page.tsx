import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { reviewDate } from "@/lib/format";
import { reviewsByUser } from "@/lib/reviews";
import { Stars } from "@/components/ui/stars";
import { DeleteReviewButton } from "@/components/account/delete-review-button";

export const metadata: Metadata = { title: "Your reviews" };

export default async function MyReviewsPage() {
  const user = await requireUser("/account/reviews");
  const reviews = await reviewsByUser(user.id);
  const withProduct = reviews
    .map((review) => ({ review, product: getProduct(review.slug) }))
    .filter((row) => row.product !== undefined);

  if (withProduct.length === 0) {
    return (
      <div className="rounded-tile border border-line bg-paper px-6 py-14 text-center">
        <p className="text-[17px] font-medium text-ink">No reviews yet</p>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
          The form sits at the foot of every product page. One review per product — writing again
          replaces what you left.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {withProduct.map(({ review, product }) => (
        <li key={review.id} className="rounded-tile border border-line bg-white p-5">
          <div className="flex gap-4">
            <Link
              href={`/p/${product!.slug}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[7px] bg-paper"
            >
              <Image
                src={product!.image}
                alt={`${product!.brand} ${product!.title}`}
                fill
                sizes="80px"
                className="object-contain p-1.5"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="facts truncate text-plum-700">{product!.brand}</p>
              <h2 className="mt-0.5 text-[15px] font-medium leading-snug">
                <Link href={`/p/${product!.slug}`} className="hover:underline">
                  {product!.title}
                </Link>
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={review.rating} size="sm" />
                <span className="facts" data-num>
                  {reviewDate(review.createdAt)}
                  {review.edited && " · edited"}
                </span>
              </div>

              {review.title && <p className="mt-3 text-[15px] font-semibold text-ink">{review.title}</p>}
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">{review.body}</p>

              <div className="mt-3.5 flex items-center gap-4">
                <Link
                  href={`/p/${product!.slug}#reviews`}
                  className="text-[13px] font-semibold text-plum-700 hover:underline"
                >
                  Edit on the product page
                </Link>
                <DeleteReviewButton slug={product!.slug} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
