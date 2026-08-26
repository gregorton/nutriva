import { count } from "@/lib/format";
import { Stars } from "@/components/ui/stars";

/**
 * Card-level rating: real stars and the review count.
 *
 * This was a single meter bar on the theory that five glyphs are noise at card size. In a grid
 * the bar read as a progress indicator rather than a rating, so the cards now carry the same
 * stars as the product page, one size down.
 *
 * No numeric average on a card: the stars are a part-filled clip, so they already state the
 * score to the precision a card needs, and the figure beside them was a second read of the
 * same number. The exact average stays on the product page, next to the reviews link.
 */
export function Rating({ value, reviews, className = "" }: { value: number; reviews: number; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <Stars value={value} size="sm" />
      <span className="facts min-w-0 truncate text-sold" data-num>
        {count(reviews)}
      </span>
    </span>
  );
}
