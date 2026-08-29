import Link from "next/link";

/*
  Keyset paging as links, not buttons — lib/query.ts's rule that navigation state lives in the
  URL. Shareable, back-navigable, and no JavaScript on a page that is already only ever read.

  A keyset cursor only moves forward, so there is no "previous": the way back is to the newest
  page, which is the unparameterised URL.
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
    "rounded-card border border-line px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-ink";

  return (
    <nav className="mt-6 flex items-center gap-2" aria-label="Pages">
      {cursor && (
        <Link href={base} className={style}>
          ← Newest
        </Link>
      )}
      {nextCursor && (
        <Link href={`${base}?before=${encodeURIComponent(nextCursor)}`} className={style}>
          Older →
        </Link>
      )}
    </nav>
  );
}
