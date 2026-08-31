import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { reviewDate } from "@/lib/format";
import { reviewsByUser } from "@/lib/reviews";
import { Stars } from "@/components/ui/stars";
import { DeleteReviewButton } from "@/components/account/delete-review-button";
import { AccountHeading, EmptyPanel } from "@/components/account/account-panels";
import { StarIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Your reviews" };

export default async function MyReviewsPage() {
  const user = await requireUser("/account/reviews");
  const reviews = await reviewsByUser(user.id);

  // Resolved against the catalogue, so a review of a product a refresh retired drops out of the
  // list rather than breaking it. The delete button is the only client-side piece here.
  const rows = reviews.flatMap((review) => {
    const product = getProduct(review.slug);
    return product ? [{ review, product }] : [];
  });

  if (rows.length === 0) {
    return (
      <EmptyPanel
        icon={<StarIcon className="h-6 w-6 text-star" />}
        title="No reviews yet"
        action={{ href: "/account/saved", label: "Your saved items" }}
      >
        The form sits at the foot of any product page. Reviews are attributed to your display name.
      </EmptyPanel>
    );
  }

  return (
    <>
      <AccountHeading
        title="Your reviews"
        count={`${rows.length} ${rows.length === 1 ? "review" : "reviews"}`}
      />

      <ul className="space-y-4">
        {rows.map(({ review, product }) => (
          <li key={review.id} className="rounded-tile border border-line bg-white p-4 sm:p-5">
            <div className="flex gap-4">
              <Link
                href={`/p/${product.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[7px] bg-paper"
              >
                <Image
                  src={product.image}
                  alt={`${product.brand} ${product.title}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="facts truncate text-plum-700">{product.brand}</p>
                <h3 className="mt-0.5 text-[15px] font-medium leading-snug">
                  <Link href={`/p/${product.slug}`} className="hover:underline">
                    {product.title}
                  </Link>
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={review.rating} size="sm" />
                  <span className="facts" data-num>
                    {reviewDate(review.createdAt)}
                    {review.edited && " · edited"}
                  </span>
                </div>

                {review.title && (
                  <p className="mt-3 text-[15px] font-semibold text-ink">{review.title}</p>
                )}
                <p className="mt-1.5 max-w-[70ch] whitespace-pre-line text-sm leading-relaxed text-ink">
                  {review.body}
                </p>

                <div className="mt-4 flex items-center gap-4 border-t border-line pt-3">
                  <Link
                    href={`/p/${product.slug}#reviews`}
                    className="text-[13px] font-semibold text-plum-700 hover:underline"
                  >
                    Edit on the product page
                  </Link>
                  <DeleteReviewButton slug={product.slug} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
