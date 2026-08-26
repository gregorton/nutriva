import Link from "next/link";
import type { Metadata } from "next";
import { KITS, startersUnder } from "@/lib/starters";
import { GUIDES } from "@/lib/guides";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { KitCard } from "@/components/starters/kit-card";
import { GuideCard } from "@/components/guides/guide-card";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "Starter kits",
  description:
    "Two or three bottles that go together, at what they cost separately. Picked for a first shelf, with the pack sizes and the reasoning shown.",
};

/*
  The starter-kit shelf. Written for 16 and up, which is a real constraint rather than a tone:
  `lib/starters.ts` keeps children's lines and melatonin out of every kit, and the note at the
  foot of this page says out loud what this section will not do. That paragraph is the part that
  makes the rest of it trustworthy, so it is on the page rather than in a policy nobody opens.
*/
export default function StartersPage() {
  const singles = startersUnder(500, 30, 10);
  const guides = GUIDES.filter((g) => KITS.some((k) => k.guides.includes(g.slug))).slice(0, 3);

  return (
    <div className="shell py-6">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Starter kits" }]} />

      <header className="mt-3 border-b border-line pb-6">
        <p className="kicker text-plum-700">Picked for a first shelf · 16 and up</p>
        <h1 className="mt-2 max-w-3xl text-[28px] sm:text-[34px]">
          Two or three bottles, chosen so you don&apos;t have to
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Each kit is the best-selling product we stock for each slot, at what the items cost
          separately — there is no bundle discount and nothing here is exclusive to a kit. What you
          get for the price is the choosing, the pack sizes shown so you can see how long it lasts,
          and a guide that explains the label before you spend anything.
        </p>
      </header>

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {KITS.map((kit) => (
          <li key={kit.slug}>
            <KitCard kit={kit} />
          </li>
        ))}
      </ul>

      {singles.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            kicker="Under ฿500, a month or more per pack, 4.5 and above"
            title="One bottle at a time"
            href="/deals"
            linkLabel="See markdowns"
          />
          <div className="mt-5">
            <ProductGrid products={singles} />
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            kicker="The label arithmetic, first"
            title="Read before you buy"
            href="/guides"
            linkLabel="All guides"
          />
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <GuideCard guide={guide} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The one place on the site allowed to print the claim words, because it is refusing them
          — reference/starters-check.mjs sweeps every other element for exactly these phrases and
          skips this section by id. */}
      <section
        id="what-we-wont-do"
        className="mt-14 rounded-tile border border-line bg-paper-warm p-5 sm:p-6"
      >
        <h2 className="font-sans text-[16px] font-semibold tracking-normal text-ink">
          What this section will not do
        </h2>
        <div className="mt-2 max-w-3xl space-y-2 text-[14px] leading-relaxed text-muted">
          <p>
            No kit here is sold on weight, appearance or exam results. Nothing on this page claims
            to help you focus, study, burn fat or change how you look — those are the claims this
            category is worst at keeping, and a storefront cannot make them honestly.
          </p>
          <p>
            Melatonin is stocked and is not in any kit. It is the one product a first-time buyer is
            most likely to reach for without reading, so it stays a deliberate choice from the{" "}
            <Link href="/c/sleep" className="font-medium text-plum-700 hover:underline">
              sleep shelf
            </Link>
            , next to the{" "}
            <Link href="/guides/magnesium-forms" className="font-medium text-plum-700 hover:underline">
              guide
            </Link>
            . Children&apos;s products are not in kits either — they have their own shelf in{" "}
            <Link href="/c/kids" className="font-medium text-plum-700 hover:underline">
              Kids &amp; family
            </Link>
            , where a parent is doing the buying.
          </p>
          <p>
            If you are under 18, taking medication, pregnant, or asking because of a symptom rather
            than a habit, that is a question for a pharmacist or a doctor before it is a question
            about which bottle.
          </p>
        </div>
      </section>
    </div>
  );
}
