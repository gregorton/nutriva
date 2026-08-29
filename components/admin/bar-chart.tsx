import type { DayPoint } from "@/lib/admin-stats";

/*
  A day-by-day bar chart as server-rendered inline SVG. No charting library: this project runs on five
  dependencies and a bar is a rectangle.

  The viewBox is sized to the number of days and stretched with preserveAspectRatio="none", so one
  component fits any column width. That distorts horizontally, which is why every bar is a plain rect —
  no rounded corners, no strokes, no text inside the frame, since all three would distort with it.
  Labels are HTML underneath.
*/

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formatted off the string, not through Date: `2026-08-30` parsed as a date is UTC midnight, and
 *  rendering that in a local zone west of GMT would print the previous day. */
function dayLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ""}`;
}

const FILL = {
  cyan: "fill-term-cyan",
  turmeric: "fill-turmeric-500",
  sold: "fill-sold",
} as const;

export function BarChart({
  points,
  label,
  tone = "cyan",
}: {
  points: DayPoint[];
  label: string;
  tone?: keyof typeof FILL;
}) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const peak = points.length ? Math.max(...points.map((point) => point.value)) : 0;
  // Scaled against at least 1, so an all-zero window draws a flat axis instead of dividing by zero —
  // while the caption still reports the real peak, which may well be 0.
  const scale = Math.max(1, peak);
  const slot = 10;
  const width = Math.max(points.length, 1) * slot;

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-term-dim uppercase">
          <span className="text-term-cyan" aria-hidden>
            ▸
          </span>
          {label}
        </span>
        <span className="text-[11px] text-term-dim" data-num>
          {total > 0 ? `peak ${peak} · ${total} in ${points.length}d` : "no data yet"}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: ${total} across ${points.length} days, highest ${peak}`}
        className="mt-2.5 h-28 w-full border-y border-term-line bg-term-900/60"
      >
        {points.map((point, index) => {
          const height = (point.value / scale) * 100;
          return (
            <rect
              key={point.day}
              x={index * slot + 1.25}
              y={100 - height}
              width={slot - 2.5}
              height={height}
              className={FILL[tone]}
            >
              <title>{`${dayLabel(point.day)}: ${point.value}`}</title>
            </rect>
          );
        })}
      </svg>

      {points.length > 0 && (
        <div className="mt-1.5 flex justify-between text-[11px] text-term-dim" data-num>
          <span>{dayLabel(points[0].day)}</span>
          <span>{dayLabel(points[points.length - 1].day)}</span>
        </div>
      )}
    </figure>
  );
}
