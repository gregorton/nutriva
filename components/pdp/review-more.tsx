"use client";

import { useState, useTransition } from "react";
import { loadMoreReviews } from "@/app/actions/reviews";
import type { Review } from "@/lib/reviews";
import { ReviewItem } from "@/components/pdp/review-list";

/*
  Load more, for products with more than ten reviews.

  A `?page=` parameter would be the obvious way to do this, and it would turn /p/[slug] from a
  prerendered page into a request-time render for all 470 products. So paging is a server
  function call instead: the first page ships in the HTML, and anything past it is fetched by
  cursor without the URL changing.
*/
export function ReviewMore({ slug, cursor: initialCursor }: { slug: string; cursor: string }) {
  const [extra, setExtra] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const slice = await loadMoreReviews(slug, cursor);
        setExtra((was) => [...was, ...slice.reviews]);
        setCursor(slice.cursor);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <>
      {extra.length > 0 && (
        <ul className="border-t border-line">
          {extra.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      )}

      {cursor && (
        <div className="border-t border-line pt-5">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="rounded-card border border-line-strong px-4 py-2.5 text-sm font-semibold text-plum-700 transition-colors hover:border-plum-600 hover:bg-plum-100 disabled:opacity-60"
          >
            {pending ? "Loading…" : "Load more reviews"}
          </button>
          {failed && (
            <p className="mt-2 text-[12.5px] text-sale-600">
              Could not load more just now. Try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
