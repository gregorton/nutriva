import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORY_BY_SLUG, bestSellers, getProduct, products, related } from "@/lib/catalog";
import { count, reviewCount } from "@/lib/format";
import { productReviews } from "@/lib/reviews";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AtAGlance } from "@/components/pdp/at-a-glance";
import { BuyBox } from "@/components/pdp/buy-box";
import { PackOptions } from "@/components/pdp/pack-options";
import { ProductGallery } from "@/components/pdp/product-gallery";
import { ProductInformation } from "@/components/pdp/product-information";
import { Rankings } from "@/components/pdp/rankings";
import { ReviewForm } from "@/components/pdp/review-form";
import { ReviewList } from "@/components/pdp/review-list";
import { ReviewMore } from "@/components/pdp/review-more";
import { ReviewSummary } from "@/components/pdp/review-summary";
import { SimilarItem } from "@/components/pdp/similar-item";
import { SaveButton } from "@/components/product/save-button";
import { Stars } from "@/components/ui/stars";
import { ProductRail } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";
import { TrendIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.title}`,
    description: `${product.title} from ${product.brand}. In stock in Bangkok, delivered across Thailand.`,
  };
}

/*
  Product page, laid out on the reference site's three columns: media, a summary column that
  runs title → rating → stock → pack size → at a glance → cross-sell → rankings, and a sticky
  buy box.

  Below the fold, the cross-sell rail comes first and the descriptive section second: someone
  who is not sold on this product should meet the alternatives before a wall of label copy,
  and someone who is sold has already stopped scrolling.
*/
export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = CATEGORY_BY_SLUG.get(product.category);
  // Real rank from the 30-day volume already in the catalog.
  const rank = bestSellers(Infinity, product.category).findIndex((p) => p.slug === product.slug) + 1;
  const pairs = related(product, 10);
  const [similar] = pairs;
  // Reviews written here, read through a tagged cache so this page stays prerendered.
  const reviews = await productReviews(product.slug);

  return (
    <div className="shell py-6">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: category?.name ?? product.category, href: `/c/${product.category}` },
          { label: product.brand, href: `/c/${product.category}?brand=${encodeURIComponent(product.brand)}` },
          { label: product.title },
        ]}
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)_320px]">
        <div>
          <ProductGallery product={product} />
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            {rank > 0 && rank <= 3 && (
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-[8px_2px_8px_2px] bg-plum-800 px-1.5 py-0.5 text-[12px] font-bold leading-4 text-turmeric-200">
                Best seller
              </p>
            )}

            <h1 className="text-[22px] leading-tight sm:text-[25px]">{product.title}</h1>

            <p className="facts mt-1.5">
              By{" "}
              <Link
                href={`/c/${product.category}?brand=${encodeURIComponent(product.brand)}`}
                className="font-medium text-plum-700 hover:underline"
              >
                {product.brand}
              </Link>
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[14px] font-semibold text-ink" data-num>
                {product.rating.toFixed(1)}
              </span>
              <Stars value={product.rating} />
              <a href="#reviews" className="facts text-plum-700 hover:underline" data-num>
                {reviewCount(product.reviews)} reviews
              </a>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <strong
                className={`text-[14px] font-semibold ${product.inStock ? "text-plum-700" : "text-muted"}`}
              >
                {product.inStock ? "In stock" : "Out of stock"}
              </strong>
              {product.sold30d && (
                <span className="facts flex items-center gap-1.5" data-num>
                  <TrendIcon className="h-3.5 w-3.5 shrink-0 text-plum-700" />
                  {count(product.sold30d)} sold in the last 30 days
                </span>
              )}
              {rank > 0 && rank <= 10 && category && (
                <span className="facts rounded-full bg-plum-100 px-2.5 py-1 text-plum-700">
                  <span data-num>#{rank}</span> in {category.name.toLowerCase()}
                </span>
              )}
            </div>

            <div className="mt-3.5">
              <SaveButton slug={product.slug} variant="inline" />
            </div>
          </div>

          <PackOptions product={product} />
          <AtAGlance product={product} />
          {similar && <SimilarItem product={similar} />}
          <Rankings product={product} />
        </div>

        {/* Clears the pinned chrome, not the viewport top — see --spacing-chrome. */}
        <div className="xl:sticky xl:top-[calc(var(--spacing-chrome)+1rem)] xl:self-start">
          <BuyBox product={product} />
        </div>
      </div>

      {pairs.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            kicker={`Also bought with this in ${category?.name.toLowerCase() ?? "this category"}`}
            title="Pairs well with"
            href={`/c/${product.category}`}
          />
          <div className="mt-5">
            <ProductRail products={pairs} />
          </div>
        </section>
      )}

      <ProductInformation product={product} />

      <section id="reviews" className="mt-14 rounded-tile border border-line bg-paper p-6">
        <SectionHeader
          kicker={
            reviews.summary.count > 0
              ? `${reviews.summary.count} written on Slim Wellness Asia`
              : "Written by people with an account here"
          }
          title="Reviews"
        />

        <div className="mt-5">
          <ReviewSummary product={product} customers={reviews.summary} />
        </div>

        {reviews.slice.reviews.length > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <ReviewList reviews={reviews.slice.reviews} />
            {reviews.slice.cursor && <ReviewMore slug={product.slug} cursor={reviews.slice.cursor} />}
          </div>
        )}

        <div className="mt-8">
          <ReviewForm slug={product.slug} />
        </div>

        <p className="mt-5 max-w-2xl text-sm text-muted">
          The product rating above left is the figure this product carries in our catalogue. The
          breakdown beside it counts only reviews written here, and every one of them is
          attributed to an account.
        </p>
      </section>
    </div>
  );
}
