import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { price } from "@/lib/format";
import { packLabel, packSiblings } from "@/lib/product-info";

/*
  Package-quantity tiles, straight off the reference site's attribute-tile group: the label
  and current selection on one line, then a row of tiles carrying each pack's own price so
  the size decision is made against real numbers.

  Each tile is a link to that pack's page — pack size is a different product in this catalog,
  not a variant of this one — so the control works without JS and is back-navigable. Renders
  nothing when the catalog holds only one size.
*/
export function PackOptions({ product }: { product: Product }) {
  const siblings = packSiblings(product);
  if (siblings.length < 2) return null;

  const current = packLabel(product);

  return (
    <section aria-label="Package quantity">
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="facts">Package quantity:</span>
        <span className="text-[13px] font-semibold text-ink" data-num>
          {current ?? "One size"}
        </span>
      </p>

      <ul className="mt-2 flex flex-wrap gap-2" role="list">
        {siblings.map((sibling) => {
          const selected = sibling.slug === product.slug;
          const label = packLabel(sibling) ?? sibling.title;
          const tile = (
            <>
              <span className="block text-[13px] font-semibold leading-snug text-ink" data-num>
                {label}
              </span>
              <span className="facts mt-0.5 block" data-num>
                {price(sibling.price)}
              </span>
            </>
          );

          return (
            <li key={sibling.slug}>
              {selected ? (
                <span
                  aria-current="true"
                  className="block min-w-[104px] rounded-[7px] border-2 border-plum-700 bg-plum-100 px-3 py-2"
                >
                  {tile}
                </span>
              ) : (
                <Link
                  href={`/p/${sibling.slug}`}
                  className="block min-w-[104px] rounded-[7px] border border-line-strong px-3 py-2 transition-colors hover:border-plum-700 hover:bg-plum-100"
                >
                  {tile}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
