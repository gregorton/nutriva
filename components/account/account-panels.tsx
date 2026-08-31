import Link from "next/link";

/*
  The empty state for every account list. Three pages used to repeat a centred grey box each,
  which is how they drifted apart in wording and padding; one component keeps them one thing.

  Composed rather than apologetic: the glyph says which list is empty, the sentence says how a
  row gets into it, and where there is somewhere to go the panel carries the way there.
*/
export function EmptyPanel({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-tile border border-line bg-paper px-6 py-14 text-center">
      <span
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white ring-1 ring-line"
      >
        {icon}
      </span>
      <p className="mt-4 text-[17px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex rounded-card bg-plum-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/*
  Order status, as a pill. One appearance for every status rather than a colour per value: the
  only status the checkout writes is `placed`, and a palette for states nothing sets yet would be
  inventing a fulfilment pipeline in CSS.
  ponytail: single treatment, split by status when the shop actually moves an order along.
*/
export function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-pandan-100 px-2.5 py-1 text-[12px] font-semibold capitalize text-pandan-700">
      {status}
    </span>
  );
}

/** Section heading inside an account page, with the count the section is showing. */
export function AccountHeading({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
      <h2 className="text-[20px] sm:text-[22px]">{title}</h2>
      {count && (
        <p className="facts" data-num>
          {count}
        </p>
      )}
      {children}
    </div>
  );
}
