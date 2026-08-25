import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * Section heading. The kicker carries a real fact about the section (how many items,
 * what the ordering means) rather than decorating it.
 */
export function SectionHeader({
  kicker,
  title,
  href,
  linkLabel = "See all",
  className = "",
}: {
  kicker?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-6 ${className}`}>
      <div>
        {kicker && <p className="kicker mb-1.5 text-muted">{kicker}</p>}
        <h2 className="text-[22px] sm:text-[26px]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-plum-700 hover:text-plum-600"
        >
          {linkLabel}
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
