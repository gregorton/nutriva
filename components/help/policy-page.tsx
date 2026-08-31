import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

/*
  One layout behind every help, about and legal page.

  Nine of these routes were linked from the footer and 404ed. They share a shape — a short lede,
  then plain prose sections, with the figures that matter pulled out into a definition list — so
  they share a component rather than nine near-identical files. Copy is passed in as data, which
  keeps each route to a table of what it says.
*/

export type PolicyFact = { term: string; value: ReactNode };
export type PolicySection = { heading: string; body?: ReactNode[]; facts?: PolicyFact[] };

export function PolicyPage({
  kicker,
  title,
  lede,
  crumb,
  sections,
  footnote,
}: {
  kicker: string;
  title: string;
  lede: ReactNode;
  /** The middle breadcrumb, when the page sits under one — "Help", "About", "Legal". */
  crumb?: string;
  sections: PolicySection[];
  footnote?: ReactNode;
}) {
  return (
    <div className="shell py-6">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          ...(crumb ? [{ label: crumb }] : []),
          { label: title },
        ]}
      />

      <header className="mt-3 max-w-[68ch] border-b border-line pb-6">
        <p className="kicker text-muted">{kicker}</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[34px]">{title}</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">{lede}</p>
      </header>

      <div className="mt-8 max-w-[68ch] space-y-9">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[19px] font-semibold text-ink">{section.heading}</h2>

            {section.body && (
              <div className="mt-2.5 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-ink">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {section.facts && (
              <dl className="mt-4 divide-y divide-line rounded-card border border-line bg-paper">
                {section.facts.map((fact) => (
                  <div key={fact.term} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3">
                    <dt className="w-full text-[13.5px] font-semibold text-ink sm:w-56">{fact.term}</dt>
                    <dd className="facts flex-1 text-[13.5px] text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>

      {footnote && (
        <p className="mt-10 max-w-[68ch] border-t border-line pt-5 text-sm text-muted">{footnote}</p>
      )}

      <p className="mt-8">
        <Link href="/" className="facts text-plum-700 underline underline-offset-4 hover:text-plum-600">
          Back to the shop
        </Link>
      </p>
    </div>
  );
}
