import Image from "next/image";
import Link from "next/link";
import type { CategorySlug } from "@/lib/catalog";
import { subcategoriesIn } from "@/lib/subcategories";
import { setHref, type RawSearchParams } from "@/lib/query";

/**
 * The browse rail at the head of a listing page: one circular tile per type the category
 * actually stocks, photographed with that type's best seller.
 *
 * Each tile is the `refine` filter as a link, so picking one narrows the grid below without
 * leaving the page, stays shareable, and toggles off when picked again. Selection is shown on
 * the tile itself rather than only in the filter chips, because the rail is where it was made.
 */
export function CategoryTypeRail({
  slug,
  name,
  base,
  raw,
  active,
}: {
  slug: CategorySlug;
  name: string;
  base: string;
  raw: RawSearchParams;
  /** the current `refine` value, if any */
  active?: string;
}) {
  const tiles = subcategoriesIn(slug);
  if (tiles.length < 2) return null;

  return (
    <nav aria-label={`${name} types`} className="mt-4">
      <ul className="rail -mx-1 flex justify-center gap-1 overflow-x-auto px-1 pb-1">
        {tiles.map(({ label, count, lead }) => {
          const isActive = active?.toLowerCase() === label.toLowerCase();
          return (
            <li key={label} className="shrink-0">
              <Link
                href={isActive ? setHref(base, raw, "refine", null) : setHref(base, raw, "refine", label)}
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className="group flex w-[104px] flex-col items-center gap-2 rounded-[10px] px-1 pb-2 pt-1.5 outline-offset-2 transition-colors hover:bg-plum-100 sm:w-[116px]"
              >
                <span
                  className={`relative flex aspect-square w-[76px] items-center justify-center overflow-hidden rounded-full bg-paper transition-[box-shadow,background-color] sm:w-[92px] ${
                    isActive
                      ? "bg-plum-100 shadow-[inset_0_0_0_2px_var(--color-plum-700)]"
                      : "shadow-[inset_0_0_0_1px_var(--color-line)] group-hover:shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
                  }`}
                >
                  <Image
                    src={lead.image}
                    alt=""
                    width={92}
                    height={92}
                    sizes="92px"
                    className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-[1.06]"
                  />
                </span>
                <span className="text-center">
                  <span
                    className={`block text-[12.5px] font-medium leading-tight ${
                      isActive ? "text-plum-700" : "text-ink group-hover:text-plum-700"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="facts mt-0.5 block" data-num>
                    {count}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
