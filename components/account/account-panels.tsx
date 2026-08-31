import Link from "next/link";

/*
  The account area's furniture: a flat white panel on the grey field, square-cornered.

  The shape comes from the reference the client pointed at — content sits in white blocks that
  each carry their own title and hairline, and the page ground is a plain grey rather than the
  storefront's warm paper. Nothing here is rounded, and the only colour is the brand plum on a
  link, so a panel reads as a surface rather than as another card in a shelf of cards.
*/
export function Panel({
  title,
  meta,
  action,
  padded = true,
  children,
}: {
  title?: string;
  /** A fact about what the panel is showing: how many rows, how many are stale. */
  meta?: string;
  action?: { href: string; label: string };
  /** Off when the content brings its own padding, as a divided list of rows does. */
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white">
      {title && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line px-4 py-3.5 sm:px-5">
          <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
          {meta && (
            <p className="facts" data-num>
              {meta}
            </p>
          )}
          {action && (
            <Link
              href={action.href}
              className="ml-auto text-[13px] font-semibold text-plum-700 hover:underline"
            >
              {action.label}
            </Link>
          )}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}

/*
  The empty state for every account list. Three pages used to repeat a centred box each, which is
  how they drifted apart in wording and padding; one component keeps them one thing.

  The glyph is grey and unringed on purpose: an empty list is not an error, and a brand-coloured
  medallion gives it more weight than it deserves.
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
    <div className="bg-white px-6 py-16 text-center">
      <span aria-hidden className="mx-auto block w-fit text-faint">
        {icon}
      </span>
      <p className="mt-4 text-[16px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex bg-plum-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/*
  Order status, as a label. One appearance for every status rather than a colour per value: the
  only status the checkout writes is `placed`, and a palette for states nothing sets yet would be
  inventing a fulfilment pipeline in CSS.
  ponytail: single treatment, split by status when the shop actually moves an order along.
*/
export function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center bg-pandan-100 px-2 py-1 text-[11.5px] font-semibold capitalize text-pandan-700">
      {status}
    </span>
  );
}
