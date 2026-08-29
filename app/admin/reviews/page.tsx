import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { recentReviews } from "@/lib/admin-stats";
import { getProduct } from "@/lib/catalog";
import { Pager } from "@/components/admin/pager";
import { When } from "@/components/admin/when";

export const metadata: Metadata = { title: "Reviews" };

/*
  Every review written on the site, newest first.

  Blocks rather than a table: a review body is prose, and prose in a table cell either wraps badly or
  forces the row heights of everything beside it.

  A retired slug is shown as the slug it was, not dropped — the review is still a real thing somebody
  wrote, and hiding it would make the overview's count disagree with this list.

  Stars are drawn here as filled and hollow glyphs rather than with components/ui/stars.tsx: that
  component's clipped overlay is tuned for the storefront's paper ground, and a rating on the console
  is a figure like any other.
*/
export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin("/admin/reviews");

  const { before } = await searchParams;
  const cursor = typeof before === "string" ? before : null;
  const page = await recentReviews(cursor);

  if (page.rows.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-term-line px-3 py-3 text-[12px] text-term-dim">
        No reviews yet. Any product page has the form at the foot of it.
      </p>
    );
  }

  return (
    <section>
      <p className="mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-term-dim uppercase">
        <span className="text-term-cyan" aria-hidden>
          ▸
        </span>
        reviews · newest first
      </p>

      <ul className="divide-y divide-term-line border-y border-term-line">
        {page.rows.map((review) => {
          const product = getProduct(review.slug);

          return (
            <li key={review.id} className="py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[13px] text-star" aria-label={`${review.rating} out of 5`}>
                  {"★".repeat(review.rating)}
                  <span className="text-term-line">{"★".repeat(5 - review.rating)}</span>
                </span>
                {product ? (
                  <Link
                    href={`/p/${review.slug}`}
                    className="text-[12.5px] text-term-text transition-colors hover:text-term-cyan"
                  >
                    {product.brand} {product.title}
                  </Link>
                ) : (
                  <span className="text-[12.5px] text-term-dim">{review.slug} (retired)</span>
                )}
              </div>

              <p className="mt-1.5 text-[11.5px] text-term-dim">
                {review.author} · <When iso={review.createdAt} />
                {review.edited && " · edited"}
              </p>

              {review.title && <p className="mt-2.5 text-[12.5px] text-term-text">{review.title}</p>}
              <p className="mt-1 max-w-[90ch] text-[12px] leading-relaxed text-term-dim">{review.body}</p>
            </li>
          );
        })}
      </ul>

      <Pager base="/admin/reviews" cursor={cursor} nextCursor={page.cursor} />
    </section>
  );
}
