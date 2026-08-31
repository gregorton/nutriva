import type { Product } from "@/lib/catalog";

/**
 * The signature device: a back-of-bottle spec row.
 *
 * Pack size is the figure a photo cannot show and the one shoppers compare a listing on. Set in
 * the small tabular face so the figures line up down a grid column.
 *
 * Layout rule that matters: fixed height, so card CTAs align across a grid row.
 *
 * Cost per serving used to sit on the right of this row. It was a figure we computed rather than
 * one any label states, so it is gone from the storefront entirely.
 */
const SHORT_FORM: [RegExp, string][] = [
  [/capsules?/i, "caps"],
  [/tablets?/i, "tabs"],
  [/softgels?/i, "sgels"],
  [/chewables?/i, "chews"],
  [/lozenges?/i, "loz"],
  [/gummies/i, "gummies"],
  [/packets?/i, "packets"],
  [/sachets?/i, "sachets"],
];

function packLabel(product: Product): string | null {
  const count = product.units ?? product.servings;
  if (!count) return product.packQuantity;
  if (!product.form) return `${count} servings`;
  const match = SHORT_FORM.find(([pattern]) => pattern.test(product.form!));
  return `${count} ${match ? match[1] : product.form.toLowerCase()}`;
}

export function FactsStrip({
  product,
  className = "",
  /** Right-aligned in the row: the compare checkbox, on cards. */
  action,
}: {
  product: Product;
  className?: string;
  action?: React.ReactNode;
}) {
  // The dose is already in the product title, so the strip carries pack size instead. Dose falls
  // back in when pack size is unknown.
  const spec = packLabel(product) ?? product.dose;

  return (
    <dl className={`facts flex h-[26px] items-center gap-2 border-t border-line pt-2 ${className}`}>
      <dd className="min-w-0 flex-1 truncate" data-num>
        {spec}
      </dd>
      {action}
    </dl>
  );
}
