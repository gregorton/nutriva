import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BRANDS, CATEGORY_BY_SLUG, brandBySlug, byBrand } from "@/lib/catalog";
import { price } from "@/lib/format";
import type { RawSearchParams } from "@/lib/query";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductListing } from "@/components/plp/product-listing";
import { ViewBeacon } from "@/components/analytics/view-beacon";

/*
  One brand, everything it sells.

  Prerendered for all 134 brands, which is what makes this worth having: a brand link used to be
  `/c/[category]?brand=…`, showing one shelf's slice of a brand that may sit on ten.

  The filter rail suppresses its own brand group here — the page is already one brand — but keeps
  price, availability, rating and format, which are the axes that still narrow anything.
*/
export function generateStaticParams() {
  return BRANDS.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: PageProps<"/b/[brand]">): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = brandBySlug(slug);
  if (!brand) return {};
  return {
    title: brand.name,
    description: `${brand.count} ${brand.name} products in stock in Bangkok, with the label read out in full on every page.`,
  };
}

export default async function BrandPage({ params, searchParams }: PageProps<"/b/[brand]">) {
  const { brand: slug } = await params;
  const brand = brandBySlug(slug);
  if (!brand) notFound();

  const raw = (await searchParams) as RawSearchParams;
  const pool = byBrand(brand.name);
  const cheapest = Math.min(...pool.map((product) => product.price));
  const dearest = Math.max(...pool.map((product) => product.price));
  const inStock = pool.filter((product) => product.inStock).length;

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="brand" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: brand.name }]} />

      <header className="mt-3 border-b border-line pb-5">
        <p className="kicker text-muted">Brand</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[34px]">{brand.name}</h1>

        <p className="facts mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span data-num>
            {brand.count} {brand.count === 1 ? "product" : "products"}
          </span>
          <span className="font-medium text-pandan-700" data-num>
            {inStock} in stock
          </span>
          <span data-num>
            {price(cheapest)} – {price(dearest)}
          </span>
        </p>

        <nav aria-label="Shelves this brand appears on" className="mt-3.5">
          <ul className="flex flex-wrap gap-2">
            {brand.categories.map((category) => {
              const entry = CATEGORY_BY_SLUG.get(category);
              if (!entry) return null;
              return (
                <li key={category}>
                  <Link
                    href={`/c/${category}?brand=${encodeURIComponent(brand.name)}`}
                    className="flex h-7 items-center rounded-full bg-plum-100 px-3 text-[12.5px] font-medium text-plum-800 transition-colors hover:bg-plum-200"
                  >
                    {entry.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <ProductListing base={`/b/${brand.slug}`} raw={raw} pool={pool} showBrands={false} />
    </div>
  );
}
