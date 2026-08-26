import { StarIcon } from "@/components/ui/icons";

/*
  Five-star rating. Used on the product page and, since the card meter was replaced by real
  stars, on product cards and the home rails too.

  The fill is a clipped overlay so a 4.8 shows four full stars and a part-filled fifth rather
  than rounding up to a claim the data does not make. Stars are the one yellow in the palette:
  a rating reads as a rating in yellow and as decoration in anything else.

  Two sizes, because the row width has to be fixed for the clipped copy to line up exactly over
  the empty one — `md` (5 × 18px + 4 × 2px gaps) for the product page, `sm` (5 × 14px) for the
  card grid, where a two-up mobile card cannot spare the extra 20px.
*/
const SIZES = {
  sm: { glyph: "h-[18px] w-[18px]", row: "w-[98px]" },
  md: { glyph: "h-[22px] w-[22px]", row: "w-[118px]" },
} as const;

export type StarSize = keyof typeof SIZES;

function Row({
  size,
  className,
  filled,
}: {
  size: StarSize;
  className: string;
  filled: boolean;
}) {
  const { glyph, row } = SIZES[size];
  return (
    <span className={`flex shrink-0 gap-0.5 ${row} ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} className={`${glyph} shrink-0`} filled={filled} />
      ))}
    </span>
  );
}

export function Stars({
  value,
  size = "md",
  className = "",
}: {
  value: number;
  size?: StarSize;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span
      className={`relative inline-flex ${className}`}
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      <Row size={size} className="text-star" filled={false} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <Row size={size} className="text-star" filled={true} />
      </span>
    </span>
  );
}
