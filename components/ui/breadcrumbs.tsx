import Link from "next/link";

/** Breadcrumbs: one path, not the reference's three overlapping ones. */
export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="facts flex flex-wrap items-center gap-1.5">
      {trail.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-line-strong" aria-hidden>
              /
            </span>
          )}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-plum-700 hover:underline">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-ink">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
