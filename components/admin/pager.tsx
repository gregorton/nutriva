import Link from "next/link";

/*
  Keyset paging as links, not buttons — lib/query.ts's rule that navigation state lives in the URL.
  Shareable, back-navigable, and no JavaScript on a page that is only ever read.

  A keyset cursor only moves forward, so there is no "previous": the way back is to the newest page,
  which is the unparameterised URL.
*/
export function Pager({
  base,
  cursor,
  nextCursor,
}: {
  base: string;
  cursor?: string | null;
  nextCursor: string | null;
}) {
  if (!cursor && !nextCursor) return null;

  const style =
    "rounded-card border border-term-line px-3 py-1.5 text-[12px] text-term-dim transition-colors hover:border-term-edge hover:bg-term-900 hover:text-term-cyan";

  return (
    <nav className="mt-6 flex items-center gap-2" aria-label="Pages">
      {cursor && (
        <Link href={base} className={style}>
          ← newest
        </Link>
      )}
      {nextCursor && (
        <Link href={`${base}?before=${encodeURIComponent(nextCursor)}`} className={style}>
          older →
        </Link>
      )}
    </nav>
  );
}
