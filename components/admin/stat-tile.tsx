import Link from "next/link";
import { reviewCount } from "@/lib/format";

/*
  A figure on the console: label, number, and a line saying what the number is not.

  Same job as app/account/page.tsx's SummaryTile and none of its dressing — no icon, and the link is
  optional, because half of these numbers have no page to lead to.
*/
export function StatTile({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: number;
  note?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-term-dim uppercase">
        <span className="text-term-cyan" aria-hidden>
          ▸
        </span>
        {label}
      </p>
      <p className="mt-2.5 text-[30px] leading-none text-term-text" data-num>
        {reviewCount(value)}
      </p>
      {note && <p className="mt-2 max-w-[30ch] text-[11.5px] leading-snug text-term-dim">{note}</p>}
    </>
  );

  const shell = "block rounded-card border border-term-line bg-term-900 p-4";

  return href ? (
    <Link href={href} className={`${shell} transition-colors hover:border-term-edge hover:bg-term-800`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}
