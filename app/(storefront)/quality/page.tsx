import Link from "next/link";
import type { Metadata } from "next";
import { STORAGE_MAX_C } from "@/lib/delivery";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "How we hold stock",
  description: "What Slim Wellness Asia does to a bottle between the manufacturer and your door — and what it does not.",
};

export default function QualityPage() {
  return (
    <PolicyPage
      kicker="About"
      crumb="About"
      title="How we hold stock"
      lede="This page is mostly about what we do not do. A shop that oversells its own role is the thing this catalogue was built to avoid."
      sections={[
        {
          heading: "We do not run a laboratory",
          body: [
            "Slim Wellness Asia tests nothing. We hold no laboratory, commission no assays and issue no certificates of analysis. Any certificate for a product on this site is the manufacturer's, about their batch, and they are the ones to ask for it.",
            <>
              What that means for reading a label here is set out in the guide on{" "}
              <Link
                href="/guides/reading-a-coa"
                className="font-medium text-plum-700 underline underline-offset-4 hover:text-plum-600"
              >
                reading a certificate of analysis
              </Link>
              .
            </>,
          ],
        },
        {
          heading: "What we do do",
          facts: [
            {
              term: "Storage",
              value: (
                <>
                  Held below <span data-num>{STORAGE_MAX_C}</span>°C, out of direct light, in our
                  Bangkok warehouse
                </>
              ),
            },
            { term: "Seals", value: "Shipped as the manufacturer sealed them; nothing is decanted or relabelled" },
            { term: "Dates", value: "Best-by taken off the batch on the shelf, printed on the product page where the label states one" },
            { term: "Stock", value: "Our own; nothing on this site is drop-shipped" },
          ],
        },
        {
          heading: "Where the product data comes from",
          body: [
            "Titles, label panels, supplement facts, certifications, pack sizes and best-by dates are read off the product listing and the bottle, not written by us. A field the label does not state is left blank and its panel does not appear — which is why some products show fewer facts than others.",
            "Ratings and review counts carried over from the source listing are labelled as that. Reviews written on this site are counted separately and never averaged into the same figure.",
          ],
        },
      ]}
    />
  );
}
