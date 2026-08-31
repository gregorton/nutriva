import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, CATEGORY_BY_SLUG, byCategory, type CategorySlug } from "@/lib/catalog";
import { values, type RawSearchParams } from "@/lib/query";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductListing } from "@/components/plp/product-listing";
import { CategoryTypeRail } from "@/components/plp/category-type-rail";
import { ViewBeacon } from "@/components/analytics/view-beacon";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug as CategorySlug);
  if (!category) return {};
  return { title: category.name, description: category.blurb };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug as CategorySlug);
  if (!category) notFound();

  const raw = (await searchParams) as RawSearchParams;
  const base = `/c/${category.slug}`;

  return (
    <div className="shell py-6">
      <ViewBeacon kind="surface" value="category" />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: category.name }]} />

      <header className="mt-3 border-b border-line pb-5">
        <h1 className="text-[28px] sm:text-[34px]">{category.name}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{category.blurb}</p>

        {/* Browse the category by type before filtering it — see CategoryTypeRail. */}
        <CategoryTypeRail
          slug={category.slug}
          name={category.name}
          base={base}
          raw={raw}
          active={values(raw, "refine")[0]}
        />
      </header>

      <ProductListing base={base} raw={raw} pool={byCategory(category.slug)} slug={category.slug} />
    </div>
  );
}
