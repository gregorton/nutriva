import { GUIDES } from "@/lib/guides";
import { SectionHeader } from "@/components/ui/section-header";
import { GuideFeature, GuideRow } from "@/components/guides/guide-card";

/**
 * Guides on the home page: one photographed feature beside a stack of three.
 *
 * This was four typographic cards, on the theory that the question was the draw. On a page that
 * is otherwise all product photography it read as small print, and nobody entered it. Leading
 * with a picture per guide costs nothing the catalogue does not already spend and gives the
 * section a shape of its own — asymmetric, where every other band on the page is a grid.
 */
export function EditorialStrip() {
  const [feature, ...rest] = GUIDES;
  if (!feature) return null;

  return (
    <section className="shell mt-14">
      <SectionHeader
        kicker={`How to read a label · ${GUIDES.length} guides`}
        title="Before you buy"
        href="/guides"
        linkLabel="All guides"
      />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <GuideFeature guide={feature} />

        {/* Every remaining guide, spread down the column: the whole set fits beside one feature,
            and `justify-between` keeps the panel from ending in a void when it is shorter than
            the photograph next to it. */}
        <div className="flex flex-col justify-between divide-y divide-line rounded-card border border-line bg-paper px-4 py-4 sm:px-5">
          {rest.map((guide) => (
            <GuideRow key={guide.slug} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  );
}
