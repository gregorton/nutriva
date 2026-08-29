import Link from "next/link";
import { reviewCount } from "@/lib/format";

/*
  The dashboard's figure tile — app/account/page.tsx's SummaryTile, minus the icon and with the
  link made optional, because half of these numbers have no page to lead to.
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
      <p className="kicker text-muted">{label}</p>
      <p className="mt-3 font-display text-[34px] leading-none" data-num>
        {reviewCount(value)}
      </p>
      {note && <p className="facts mt-2 max-w-[32ch]">{note}</p>}
    </>
  );

  const shell = "rounded-tile border border-line bg-paper p-5";

  return href ? (
    <Link href={href} className={`${shell} transition-colors hover:border-line-strong hover:bg-white`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}
