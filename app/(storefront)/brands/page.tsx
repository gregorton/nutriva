import Link from "next/link";
import type { Metadata } from "next";
import { BRANDS, CATEGORY_BY_SLUG, products } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export const metadata: Metadata = {
  title: "All brands",
  description: "Every brand on the shelves, with how much of each we stock.",
};

/*
  The index for /b/[brand]. Without it those 134 pages have exactly one entry point each — the
  product page of something that brand makes — which is no way to find a brand you already trust.

  Static: no searchParams, so this one does prerender.

  Grouped by first letter. Brands beginning with a digit — 21st Century, 4Life — go in a "#" group,
  whose anchor id is spelled out rather than using the character, because `#letter-#` is not a
  fragment. The offset that clears the pinned chrome comes from the `section[id]` rule in
  globals.css, so nothing here sets `scroll-margin-top` of its own.
*/
export default function BrandsPage() {
  const byLetter = new Map<string, typeof BRANDS>();
  for (const brand of [...BRANDS].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = /[a-z]/i.test(brand.name[0]) ? brand.name[0].toUpperCase() : "#";
    const group = byLetter.get(letter);
    if (group) group.push(brand);
    else byLetter.set(letter, [brand]);
  }
  const anchor = (letter: string) => `letter-${letter === "#" ? "0-9" : letter}`;
  const letters = [...byLetter.keys()].sort((a, b) => (a === "#" ? -1 : b === "#" ? 1 : a.localeCompare(b)));

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="brands" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "All brands" }]} />

      <header className="mt-3 border-b border-line pb-5">
        <p className="kicker text-muted" data-num>
          {BRANDS.length} brands · {products.length} products
        </p>
        <h1 className="mt-1.5 text-[28px] sm:text-[34px]">All brands</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted">
          Every brand we hold, with what each one takes up on the shelves. A brand page shows all of
          it, across every category.
        </p>
      </header>

      <nav aria-label="Jump to a letter" className="mt-5 flex flex-wrap gap-1.5">
        {letters.map((letter) => (
          <a
            key={letter}
            href={`#${anchor(letter)}`}
            className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-line text-[13px] font-semibold text-plum-800 transition-colors hover:border-plum-600 hover:bg-plum-100"
          >
            {letter}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-9">
        {letters.map((letter) => (
          <section key={letter} id={anchor(letter)}>
            <h2 className="kicker border-b border-line pb-2 text-muted">{letter}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {byLetter.get(letter)?.map((brand) => (
                <li key={brand.slug}>
                  <Link
                    href={`/b/${brand.slug}`}
                    className="flex items-baseline justify-between gap-3 py-1 text-[14px] text-ink hover:text-plum-700"
                  >
                    <span className="min-w-0 truncate">{brand.name}</span>
                    <span className="facts shrink-0" data-num>
                      {brand.count} ·{" "}
                      {brand.categories.length > 1
                        ? `${brand.categories.length} shelves`
                        : CATEGORY_BY_SLUG.get(brand.categories[0])?.name.toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
