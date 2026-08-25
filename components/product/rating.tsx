import { count } from "@/lib/format";
import { Stars } from "@/components/ui/stars";

/**
 * Card-level rating: real stars, the average, and the review count.
 *
 * This was a single meter bar on the theory that five glyphs are noise at card size. In a grid
 * the bar read as a progress indicator rather than a rating, so the cards now carry the same
 * stars as the product page, one size down.
 */
export function Rating({ value, reviews, className = "" }: { value: number; reviews: number; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <span className="facts shrink-0 font-medium text-ink" data-num>
        {value.toFixed(1)}
      </span>
      <Stars value={value} size="sm" />
      <span className="facts min-w-0 truncate" data-num>
        {count(reviews)}
      </span>
    </span>
  );
}
