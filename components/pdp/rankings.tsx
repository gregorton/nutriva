import Link from "next/link";
import { CATEGORY_BY_SLUG, bestSellers, type Product } from "@/lib/catalog";
import { ChevronRightIcon } from "@/components/ui/icons";

/*
  Product rankings, as the reference site stacks them under the summary column. Both figures are
  real: the catalog carries 30-day volume, so a rank is a position in that ordering rather than
  a badge. The reference nests three taxonomy levels; this catalog has one category plus the
  whole store, so it shows those two and nothing invented in between.

  Ranks outside the top 25 are dropped — "#134 in vitamins" is not a ranking, it is a row number.
*/
const CUTOFF = 25;

function rankIn(product: Product, scope?: Product["category"]): number | null {
  const rank = bestSellers(Infinity, scope).findIndex((p) => p.slug === product.slug) + 1;
  return rank > 0 && rank <= CUTOFF ? rank : null;
}

export function Rankings({ product }: { product: Product }) {
  const category = CATEGORY_BY_SLUG.get(product.category);
  const rows = [
    { rank: rankIn(product, product.category), label: category?.name ?? product.category, href: `/c/${product.category}` },
    { rank: rankIn(product), label: "Everything we stock", href: "/" },
  ].filter((row): row is { rank: number; label: string; href: string } => row.rank !== null);

  if (rows.length === 0) return null;

  return (
    <section aria-label="Product rankings">
      <h2 className="facts font-semibold uppercase tracking-wide text-muted">Product rankings</h2>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="text-[13px]">
            <span className="font-semibold text-plum-700" data-num>
              #{row.rank}
            </span>{" "}
            in{" "}
            <Link href={row.href} className="font-medium text-ink underline-offset-2 hover:underline">
              {row.label}
            </Link>
            <ChevronRightIcon className="ml-0.5 inline h-3.5 w-3.5 text-faint align-[-2px]" />
          </li>
        ))}
      </ul>
      <p className="facts mt-1.5">By units sold in the last 30 days.</p>
    </section>
  );
}
