import { reviewDate } from "@/lib/format";
import type { Review } from "@/lib/reviews";
import { Stars } from "@/components/ui/stars";

/*
  One review. Shared by the prerendered first page and the client-side Load more, so a review
  that streams in later is indistinguishable from one that shipped in the HTML.
*/
export function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Stars value={review.rating} size="sm" />
        {review.title && <p className="text-[15px] font-semibold text-ink">{review.title}</p>}
      </div>

      <p className="facts mt-1.5" data-num>
        {review.author} · {reviewDate(review.createdAt)}
        {review.edited && " · edited"}
      </p>

      {/* whitespace-pre-line, so paragraph breaks someone typed survive without a markdown
          renderer and without dangerouslySetInnerHTML. */}
      <p className="mt-2.5 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">
        {review.body}
      </p>
    </li>
  );
}

/** The first page, rendered on the server and cached with the page. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <ul>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </ul>
  );
}
