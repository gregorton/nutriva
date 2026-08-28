import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORY_BY_SLUG } from "@/lib/catalog";
import { GUIDES, creditLine, getGuide, guideProducts, otherGuides } from "@/lib/guides";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { GuideCard } from "@/components/guides/guide-card";
import { ProductRail } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";
import { ArrowIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.dek };
}

/*
  One guide. Read order is standfirst → cover → the short version → body → the shelf the article
  is about → other guides.

  The takeaways box sits above the body rather than below it on purpose: someone comparing two
  bottles in a shop wants the three sentences, and someone who wants the reasoning scrolls. The
  body column is capped near 68 characters, which is why it is not a full-width band like the
  product page's information section — that one is a spec table, this is prose.

  Copy blocks are structured data, not HTML, so there is no markdown renderer here and nothing
  to sanitise: `lib/guides.ts` holds headings, paragraphs and term/detail pairs, and this file
  decides what each looks like.
*/
export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const credit = creditLine(guide.photo);
  const products = guideProducts(guide);
  const shelf = guide.shelf ? CATEGORY_BY_SLUG.get(guide.shelf.category) : null;
  const shelfHref = guide.shelf
    ? `/c/${guide.shelf.category}${guide.shelf.refine ? `?refine=${encodeURIComponent(guide.shelf.refine)}` : ""}`
    : null;
  const more = otherGuides(guide.slug);

  return (
    <div className="shell py-6">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: guide.tag },
        ]}
      />

      <article className="mt-4">
        <header className="max-w-3xl">
          <p className="facts flex flex-wrap items-center gap-2">
            <span className="kicker text-plum-700">{guide.tag}</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span data-num>{guide.minutes} min read</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span>Label reading</span>
          </p>
          <h1 className="mt-2.5 text-[30px] leading-[1.08] sm:text-[38px]">{guide.title}</h1>
          <p className="mt-3.5 text-[16px] leading-relaxed text-muted sm:text-[17px]">{guide.dek}</p>
        </header>

        {guide.photo && (
          <figure className="mt-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-tile bg-paper">
              <Image
                src={guide.photo.file}
                alt=""
                fill
                sizes="(max-width: 1344px) 100vw, 1312px"
                priority
                className="object-cover"
              />
            </div>
            {credit && (
              <figcaption className="facts mt-2 text-right text-faint">
                Photo:{" "}
                {guide.photo.sourceUrl ? (
                  <a
                    href={guide.photo.sourceUrl}
                    rel="noopener noreferrer nofollow"
                    className="hover:text-plum-700 hover:underline"
                  >
                    {credit}
                  </a>
                ) : (
                  credit
                )}
              </figcaption>
            )}
          </figure>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,68ch)_1fr] lg:gap-12">
          <div className="min-w-0">
            {guide.sections.map((section) => (
              <section key={section.heading} className="mt-8 first:mt-0">
                <h2 className="text-[21px] leading-tight sm:text-[24px]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-[15.5px] leading-[1.65] text-ink/90">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <dl className="mt-4 divide-y divide-line rounded-card border border-line bg-paper px-4">
                    {section.bullets.map((bullet) => (
                      <div key={bullet.term} className="py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
                        <dt className="text-[13.5px] font-semibold text-plum-700">{bullet.term}</dt>
                        <dd className="mt-0.5 text-[13.5px] leading-snug text-muted sm:mt-0">
                          {bullet.detail}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            ))}

            <p className="mt-8 border-t border-line pt-4 text-[13px] leading-relaxed text-faint">
              This is about labels, not about you: nothing here is a diagnosis or a dose.
              Reference intakes quoted are population figures. If you take medication, are
              pregnant or breastfeeding, or are asking because of a symptom, ask a pharmacist or a
              doctor first.
            </p>
          </div>

          {/* Takeaways ride beside the body on wide screens and above it on a phone, where the
              order in source puts them straight after the standfirst. */}
          <aside className="order-first lg:order-none lg:sticky lg:top-[calc(var(--spacing-chrome)+1rem)] lg:self-start">
            <div className="rounded-card border border-line bg-plum-100 p-5">
              <p className="kicker text-plum-700">The short version</p>
              <ul className="mt-3 space-y-3">
                {guide.takeaways.map((point) => (
                  <li key={point} className="flex gap-2.5 text-[13.5px] leading-snug text-ink">
                    <span
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-turmeric-500"
                      aria-hidden
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {shelfHref && shelf && (
              <Link
                href={shelfHref}
                className="group mt-4 flex items-center justify-between gap-3 rounded-card border border-line bg-white p-4 transition-colors hover:border-plum-600"
              >
                <span>
                  <span className="kicker block text-muted">Shop the shelf</span>
                  <span className="mt-1 block text-[14px] font-semibold text-ink">
                    {guide.shelf?.label ?? shelf.name}
                  </span>
                </span>
                <ArrowIcon className="h-4 w-4 shrink-0 text-plum-700 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </aside>
        </div>
      </article>

      {products.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            kicker={
              guide.shelf
                ? `Ranked by units sold in ${shelf?.name.toLowerCase() ?? "this shelf"}`
                : "Ranked by units sold in the last 30 days"
            }
            title={guide.shelf?.label ?? "Best sellers"}
            href={shelfHref ?? "/c/vitamins"}
          />
          <div className="mt-5">
            <ProductRail products={products} />
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="mt-14">
          <SectionHeader kicker="Other labels, other numbers" title="More guides" href="/guides" linkLabel="All guides" />
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((other) => (
              <li key={other.slug}>
                <GuideCard guide={other} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
