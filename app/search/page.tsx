import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, search } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { values, type RawSearchParams } from "@/lib/query";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams) as RawSearchParams;
  const query = values(raw, "q")[0] ?? "";
  const results = search(query);

  return (
    <div className="shell py-6">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Search" }]} />

      <header className="mt-3 border-b border-line pb-5">
        <h1 className="text-[26px] sm:text-[32px]">
          {query ? <>Results for “{query}”</> : "Search"}
        </h1>
        {query && (
          <p className="mt-1.5 text-sm text-muted">
            <span className="font-semibold text-ink" data-num>
              {results.length}
            </span>{" "}
            {results.length === 1 ? "product" : "products"}
          </p>
        )}
      </header>

      {results.length > 0 ? (
        <div className="mt-6">
          <ProductGrid products={results} />
        </div>
      ) : (
        <div className="mt-6 rounded-card border border-line bg-paper px-6 py-14 text-center">
          <p className="font-display text-lg">
            {query ? <>Nothing matched “{query}”</> : "Type what you are looking for"}
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            Try a nutrient (magnesium), a format (gummies) or a brand. Or start from a category:
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/c/${category.slug}`}
                  className="flex h-8 items-center rounded-full border border-line-strong bg-white px-3.5 text-[13px] font-medium transition-colors hover:border-plum-600 hover:text-plum-700"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
