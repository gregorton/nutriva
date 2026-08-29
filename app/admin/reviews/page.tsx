import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { recentReviews } from "@/lib/admin-stats";
import { getProduct } from "@/lib/catalog";
import { Pager } from "@/components/admin/pager";
import { When } from "@/components/admin/when";
import { Stars } from "@/components/ui/stars";

export const metadata: Metadata = { title: "Reviews" };

/*
  Every review written on the site, newest first.

  Blocks rather than a table: a review body is prose, and prose in a table cell either wraps badly
  or forces the row heights of everything beside it.

  A slug is resolved through getProduct() and a retired one is shown as the slug it was, not
  dropped — the review is still a real thing somebody wrote, and hiding it would make the count on
  the overview disagree with this list.
*/
export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin("/admin/reviews");

  const { before } = await searchParams;
  const cursor = typeof before === "string" ? before : null;
  const page = await recentReviews(cursor);

  if (page.rows.length === 0) {
    return <p className="facts">No reviews yet. Any product page has the form at the foot of it.</p>;
  }

  return (
    <section>
      <ul className="divide-y divide-line border-y border-line">
        {page.rows.map((review) => {
          const product = getProduct(review.slug);

          return (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Stars value={review.rating} size="sm" />
                <span className="facts" data-num>
                  {review.rating} of 5
                </span>
                {product ? (
                  <Link href={`/p/${review.slug}`} className="text-sm font-medium hover:underline">
                    {product.brand} {product.title}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-muted">{review.slug} (retired)</span>
                )}
              </div>

              <p className="facts mt-1.5">
                {review.author} · <When iso={review.createdAt} />
                {review.edited && " · edited"}
              </p>

              {review.title && <p className="mt-2.5 font-medium">{review.title}</p>}
              <p className="mt-1 max-w-[80ch] text-sm text-ink">{review.body}</p>
            </li>
          );
        })}
      </ul>

      <Pager base="/admin/reviews" cursor={cursor} nextCursor={page.cursor} />
    </section>
  );
}
