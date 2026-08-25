import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * Guides. Typographic cards rather than stock photography — the questions are the draw,
 * and it keeps the page from turning into a lifestyle-image collage.
 */
const GUIDES = [
  {
    question: "How much vitamin D do you actually need in Bangkok?",
    answer: "Indoor work plus sunscreen puts most adults below the reference range. What the studies say.",
    minutes: 6,
    tag: "Vitamins",
  },
  {
    question: "Magnesium: which form for sleep, which for cramps?",
    answer: "Glycinate, citrate, oxide and threonate do different jobs. A short decision table.",
    minutes: 4,
    tag: "Minerals",
  },
  {
    question: "Do probiotics survive the trip to your gut?",
    answer: "CFU count at manufacture is not CFU count at swallow. What to look for on a label.",
    minutes: 5,
    tag: "Gut",
  },
  {
    question: "Reading a certificate of analysis without a chemistry degree",
    answer: "Six lines on a COA that tell you whether a batch is worth buying.",
    minutes: 7,
    tag: "Quality",
  },
];

export function EditorialStrip() {
  return (
    <section className="shell mt-14">
      <SectionHeader kicker="Written by our pharmacists" title="Before you buy" href="/guides" linkLabel="All guides" />

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDES.map((guide) => (
          <li key={guide.question}>
            <Link
              href="/guides"
              className="group flex h-full flex-col rounded-card border border-line bg-paper p-5 transition-colors hover:border-plum-600 hover:bg-plum-100"
            >
              <p className="facts flex items-center justify-between text-plum-700">
                <span>{guide.tag}</span>
                <span data-num>{guide.minutes} min</span>
              </p>
              <h3 className="mt-3 font-display text-[19px] leading-tight">{guide.question}</h3>
              <p className="mt-2 text-[13.5px] leading-snug text-muted">{guide.answer}</p>
              <ArrowIcon className="mt-4 h-4 w-4 text-plum-700 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
