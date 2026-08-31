import Link from "next/link";
import type { Metadata } from "next";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Sourcing",
  description: "Which brands are stocked, and how they get here.",
};

export default function SourcingPage() {
  return (
    <PolicyPage
      kicker="About"
      crumb="About"
      title="Sourcing"
      lede="Around 470 products from 134 brands, chosen for what the label states rather than what the marketing claims."
      sections={[
        {
          heading: "What gets stocked",
          body: [
            "A product earns a place by having a label worth printing: a full supplement-facts panel, a stated serving size, a named form of the active. A bottle that lists a proprietary blend and no amounts is hard to compare, so it tends not to make the shelf.",
            <>
              The professional shelf is brands that sell mainly through clinics and practitioners.
              What they have in common is set out on the{" "}
              <Link href="/" className="font-medium text-plum-700 underline underline-offset-4 hover:text-plum-600">
                home page
              </Link>
              .
            </>,
          ],
        },
        {
          heading: "How it arrives",
          body: [
            "Stock is bought in, held here and shipped from here. We are a retailer, not a manufacturer and not a brand owner — nothing on this site is made for us or badged with our name.",
          ],
        },
        {
          heading: "What we will not sell",
          body: [
            "Nothing marketed on a weight-loss, cognitive-performance or exam-result claim. The starter kits exclude children's lines and melatonin by rule, in code, for the same reason.",
          ],
        },
      ]}
    />
  );
}
