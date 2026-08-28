import type { Metadata } from "next";
import { GUIDES } from "@/lib/guides";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { GuideCard, GuideFeature } from "@/components/guides/guide-card";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "How to read a supplement label: dosage forms, certificates of analysis, EPA and DHA arithmetic, and what reference intakes say.",
};

/*
  Guides index. One feature, then the rest three-up — the same shapes as the home strip, so
  arriving here from that strip feels like the same section rather than a different site.

  The note at the foot is the honest part: these are label-reading guides, not clinical advice,
  and the storefront does not run a laboratory. Saying so once, plainly, is worth more than a
  disclaimer nobody reads at the bottom of every article — which is also there.
*/
export default function GuidesPage() {
  const [feature, ...rest] = GUIDES;

  return (
    <div className="shell py-6">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Guides" }]} />

      <header className="mt-3 border-b border-line pb-6">
        <p className="kicker text-plum-700">How to read a label</p>
        <h1 className="mt-2 max-w-3xl text-[28px] sm:text-[34px]">
          Read the label before you read the marketing
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Short guides to the numbers on the back of a bottle: elemental weight, CFU claims, EPA
          and DHA content, and which lines on a certificate of analysis are worth finding.
        </p>
      </header>

      {feature && (
        <div className="mt-6 lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-5">
          <GuideFeature guide={feature} priority />
          <div className="mt-5 rounded-card border border-line bg-paper p-5 lg:mt-0 lg:self-start">
            <p className="kicker text-plum-700">The short version</p>
            <ul className="mt-3 space-y-3">
              {feature.takeaways.map((point) => (
                <li key={point} className="flex gap-2.5 text-[13.5px] leading-snug text-ink">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-turmeric-500" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((guide, i) => (
          <li key={guide.slug}>
            <GuideCard guide={guide} priority={i < 3} />
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-card border border-line bg-paper-warm p-5 sm:p-6">
        <h2 className="font-sans text-[16px] font-semibold tracking-normal text-ink">
          How these are written
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted">
          Everything here is about reading a label: unit conversions, elemental versus compound
          weight, what a CFU figure counts, which lines on a certificate of analysis are worth
          finding. Where a guide quotes a reference intake it says so and gives the figure as a
          population reference, not a dose for you. Nothing here diagnoses anything, and Slim
          Wellness Asia does not run a laboratory: the certification marks on our product pages
          are read off the manufacturer&apos;s label and imply nothing beyond it. For anything
          specific to you, including medication interactions and pregnancy, ask a pharmacist or
          a doctor.
        </p>
      </section>
    </div>
  );
}
