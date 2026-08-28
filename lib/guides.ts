import creditsJson from "./editorial.generated.json";
import { type CategorySlug, type Product, bestSellers, byCategory } from "./catalog";

/*
  Guides — the editorial side of the storefront, and the one part of it that is written rather
  than harvested.

  What is real here and what is not, on the same terms as the catalogue: the copy states general
  reference intakes, label conventions and how to read a supplement panel, all of it checkable
  against the label in your hand. It does not diagnose, does not prescribe a dose, and does not
  cite a study the site cannot show you. Where a number is a published reference intake it says
  so; where a claim would need a trial behind it, the sentence is not there.

  Photography is harvested, not ours: `reference/editorial/photos.mjs` picks one CC0 / public
  domain / CC BY image per slug and writes the credit into editorial.generated.json, which this
  module attaches to each guide so every placement can print it.

  Reading time is counted off the words in `sections` at 220wpm rather than typed in, so it can
  never drift from the article it labels.
*/

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: { term: string; detail: string }[];
};

export type PhotoCredit = {
  file: string;
  title: string | null;
  creator: string | null;
  source: string | null;
  sourceUrl: string | null;
  license: string | null;
  licenseVersion: string | null;
  licenseUrl: string | null;
  width: number | null;
  height: number | null;
};

type GuideSeed = {
  slug: string;
  tag: string;
  title: string;
  /** The one-line promise, used on cards and as the page's standfirst. */
  dek: string;
  /** What a shopper takes away without reading the body. Three, never more. */
  takeaways: string[];
  /** Which shelf the article sends people to, and the refinement inside it. */
  shelf?: { category: CategorySlug; refine?: string; label: string };
  sections: GuideSection[];
};

export type Guide = Omit<GuideSeed, never> & {
  minutes: number;
  words: number;
  photo: PhotoCredit | null;
};

const CREDITS = creditsJson as Record<string, PhotoCredit>;

const SEEDS: GuideSeed[] = [
  {
    slug: "vitamin-d-in-bangkok",
    tag: "Vitamins",
    title: "How much vitamin D do you get in Bangkok?",
    dek: "One of the sunniest cities on earth, and the answer is still less than you think. Where the sunlight goes, and what the numbers on the label mean.",
    takeaways: [
      "Window glass stops almost all the UVB your skin needs, so sitting in the sun indoors is not the same as being outside.",
      "Labels use both IU and micrograms: 1,000 IU is 25 mcg. Convert before you compare two bottles.",
      "Widely used adult reference intakes sit at 600–800 IU a day, with 4,000 IU as the usual upper limit for ongoing use.",
    ],
    shelf: { category: "vitamins", refine: "Vitamin D", label: "Vitamin D on our shelves" },
    sections: [
      {
        heading: "The sun is outside the building",
        paragraphs: [
          "Bangkok gets more usable UVB in a year than most of Europe sees in five. That fact does very little for the person who leaves a condo at 7am, sits under office lighting until 6pm, and crosses two skywalks in between.",
          "Skin makes vitamin D from UVB specifically, and UVB is the part of sunlight that ordinary window glass blocks almost entirely. A desk by a bright window is a pleasant place to work and contributes essentially nothing. Air-conditioned transit, long sleeves against the sun and sunscreen are all sensible in this climate, and all of them subtract from the same total.",
          "None of that makes a supplement compulsory, but a tropical address does not settle the question either.",
        ],
      },
      {
        heading: "IU, micrograms, and the label arithmetic",
        paragraphs: [
          "Vitamin D is stated two ways, and both appear on shelves here. The conversion is fixed: 40 IU is 1 microgram, so 1,000 IU is 25 mcg and 5,000 IU is 125 mcg. A bottle marked “50 mcg” is a 2,000 IU bottle.",
          "Two more numbers decide what you are buying: the amount per softgel and the serving size in softgels. A panel reading 5,000 IU per serving, at two softgels a serving, is a 2,500 IU softgel.",
        ],
        bullets: [
          { term: "D3 (cholecalciferol)", detail: "The form in most supplements; usually from lanolin, sometimes from lichen for a vegan label." },
          { term: "D2 (ergocalciferol)", detail: "Plant-derived, and the form used in some fortified foods. Treated as less potent per IU in most reference material." },
          { term: "In oil", detail: "Vitamin D is fat-soluble, so it comes in an oil base or is taken with a meal that has fat in it." },
        ],
      },
      {
        heading: "What the reference intakes say",
        paragraphs: [
          "The commonly published adult reference intake is 600 IU a day, rising to 800 IU past 70, with 4,000 IU generally given as the upper level for regular intake. Those are population figures for healthy adults, not a prescription for one person, and they assume food is contributing as well.",
          "Higher short courses exist, and they are a matter for a clinician. If you are pregnant, taking medication that interacts with fat-soluble vitamins, or asking because of a symptom rather than a habit, a blood test is the way to find out.",
        ],
      },
    ],
  },
  {
    slug: "magnesium-forms",
    tag: "Minerals",
    title: "Magnesium: which form for sleep, which for cramps?",
    dek: "Glycinate, citrate, oxide, malate, threonate. The differences are real, and the first one to check is not on the front of the bottle.",
    takeaways: [
      "The number on the front is often the compound, not the mineral: 500 mg of magnesium oxide carries about 300 mg of elemental magnesium.",
      "Find “elemental” or “magnesium (as …)” in the supplement facts panel and compare that figure between bottles.",
      "Forms differ mainly in how well they are tolerated, so the one you can take comfortably is worth more than the one you give up on.",
    ],
    shelf: { category: "minerals", refine: "Magnesium", label: "Magnesium on our shelves" },
    sections: [
      {
        heading: "Compound weight is not mineral weight",
        paragraphs: [
          "Magnesium is always sold bound to something else, and the bound weight is what the front label likes to shout. Magnesium oxide is roughly 60% magnesium by weight; magnesium citrate is around 16%; magnesium glycinate sits near 14%. That is why one bottle can say 500 mg and another 1,000 mg and both deliver a similar amount of the mineral.",
          "The supplement facts panel gives the figure, usually written as “Magnesium (as magnesium glycinate) 200 mg”. That 200 mg is the number to compare. Comparing front-label numbers instead just rewards whichever manufacturer picked the heaviest salt.",
        ],
      },
      {
        heading: "The forms, and what they are usually chosen for",
        paragraphs: [
          "No form is a sedative and none is a painkiller. What varies is solubility and how the gut handles it, which in practice decides whether a given dose is comfortable.",
        ],
        bullets: [
          { term: "Glycinate", detail: "Bound to glycine. The usual pick for an evening dose, mostly because it is well tolerated at higher amounts." },
          { term: "Citrate", detail: "Well absorbed and mildly laxative, which is why it also turns up in constipation products. Fine for many people, a problem for some." },
          { term: "Oxide", detail: "Cheapest per milligram of magnesium and the least soluble. Common in low-cost bottles and in laxatives, for the same reason." },
          { term: "Malate", detail: "Bound to malic acid; often chosen for daytime dosing on tolerability alone." },
          { term: "L-threonate", detail: "The most expensive shelf, marketed for cognition. Treat the marketing carefully: the evidence base is thin and mostly preclinical." },
        ],
      },
      {
        heading: "Practical label reading",
        paragraphs: [
          "Check three lines and you have compared two products properly: elemental magnesium per serving, servings per container, and how many capsules make a serving. A 120-capsule bottle at three capsules a serving is a 40-day bottle, not a four-month one.",
          "Loose stools are the ordinary signal that a dose or a form is too much, and splitting it across the day usually settles it. Anyone with reduced kidney function should not be self-dosing magnesium at all, because clearance is the whole issue. That one is a conversation with a doctor.",
        ],
      },
    ],
  },
  {
    slug: "probiotics-survival",
    tag: "Gut & digestion",
    title: "Do probiotics survive the trip to your gut?",
    dek: "CFU at manufacture is not CFU at the best-by date, and neither one tells you what reaches your gut. What a live-culture label is able to promise.",
    takeaways: [
      "“CFU at manufacture” and “CFU through best-by” are different claims. The second is the one worth paying for.",
      "Strain, not genus, is what any specific claim attaches to: Lactobacillus rhamnosus GG is a strain; “lactobacillus” names a whole genus.",
      "Refrigerated is not automatically better. Read the storage line on the product rather than assuming the category.",
    ],
    shelf: { category: "gut", refine: "Probiotics", label: "Live cultures on our shelves" },
    sections: [
      {
        heading: "What a CFU number counts",
        paragraphs: [
          "CFU stands for colony-forming units: how many organisms in a dose are still alive and able to reproduce. Live cultures decline over time, faster when warm and faster still when damp.",
          "So the same 50 billion can mean two different products. “50 billion CFU at time of manufacture” describes the batch when it left the factory. “50 billion CFU through the best-by date” is a commitment about the bottle you are holding.",
        ],
      },
      {
        heading: "Stomach acid, and what the label can claim about it",
        paragraphs: [
          "Most organisms in a capsule do not make it through gastric acid and bile, which is why formulations lean on delayed-release capsules, acid-resistant strains, or simply a larger starting count. All three are legitimate; none of them means the survival figure is measurable from the label.",
          "Be careful with numbers that sound like measurements of your gut. A product can honestly state what is in the capsule, and can honestly cite a trial on a specific strain. Nothing on a package can tell you how many organisms took up residence in a particular person.",
        ],
        bullets: [
          { term: "Strain, in full", detail: "Genus, species and strain designation: Lacticaseibacillus rhamnosus GG, not “lactobacillus blend”." },
          { term: "Guaranteed through date", detail: "Look for the phrase, not just the number." },
          { term: "Storage", detail: "Read the panel: some products need a fridge after opening, others are formulated not to." },
          { term: "Prebiotic content", detail: "Inulin or FOS feeds cultures and also, in some people, produces gas. Worth knowing before you buy 90 days of it." },
        ],
      },
      {
        heading: "The food route",
        paragraphs: [
          "Kimchi, yoghurt with live cultures, fermented vegetables and the more traditional Thai ferments do the same thing without a CFU claim, and they arrive with the rest of the meal. A capsule is a convenience and a way to target a specific studied strain, not a replacement for food.",
        ],
      },
    ],
  },
  {
    slug: "reading-a-coa",
    tag: "Quality",
    title: "Reading a certificate of analysis without a chemistry degree",
    dek: "Six lines on a COA tell you whether a batch is worth buying, whatever layout it arrives in.",
    takeaways: [
      "A COA is about one batch. If the lot number on the document is not the lot number on your bottle, it tells you nothing about what you bought.",
      "Identity, potency, and contaminant testing are the three questions. Anything else on the page is supporting detail.",
      "“Tested” without a named lab, a method and a date is a marketing word, not a result.",
    ],
    sections: [
      {
        heading: "First, match the lot",
        paragraphs: [
          "A certificate of analysis reports what a laboratory found in a specific production batch. Every useful thing about it follows from that: it has a lot or batch number, a date, and a scope. The first check is mechanical: compare the lot on the document with the lot printed or stamped on the bottle. A COA for a batch made two years ago says nothing about the one you are holding.",
        ],
      },
      {
        heading: "The six lines worth finding",
        paragraphs: [
          "Layouts vary wildly, but the same content is in all of them.",
        ],
        bullets: [
          { term: "Lot and date", detail: "Which batch, tested when. Without both, the rest cannot be checked." },
          { term: "Identity", detail: "Confirmation that the material is what it claims to be, and for a botanical that the species is right." },
          { term: "Potency / assay", detail: "How much active was found, against the label claim. Expect a stated tolerance rather than an exact match." },
          { term: "Heavy metals", detail: "Lead, arsenic, cadmium, mercury, with a limit and a result. Relevant for botanicals, greens and marine ingredients in particular." },
          { term: "Microbiology", detail: "Total counts plus specific organisms, against limits. Standard for powders and plant material." },
          { term: "Method and lab", detail: "The analytical method (HPLC, ICP-MS and so on) and who ran it. A result with no method behind it is a number, not a measurement." },
        ],
      },
      {
        heading: "Words that look like results",
        paragraphs: [
          "“Lab tested”, “clinically proven” and “pharmaceutical grade” are not defined terms in most markets and can appear on a package with nothing behind them. Certification marks (GMP registration, third-party programme seals, organic certifiers) are checkable, because the body behind them keeps a register you can search.",
          "A supplier who will not name a lab or produce a document for the batch you are buying has told you what you needed to know. Slim Wellness Asia does not run a laboratory either. What we can show you is what the manufacturer publishes on the label, which is why the marks on our product pages are read off the label and imply nothing beyond it.",
        ],
      },
    ],
  },
  {
    slug: "omega-3-labels",
    tag: "Omega & fish oil",
    title: "Fish oil: EPA, DHA, and the number the front label leaves out",
    dek: "A 1,000 mg softgel is not 1,000 mg of omega-3. Where the rest of it goes, and how to compare two bottles honestly.",
    takeaways: [
      "1,000 mg of fish oil typically carries 300 mg of EPA plus DHA. The other 700 mg is oil.",
      "Add EPA and DHA per serving, then divide by the number of softgels. That figure is what to compare between bottles.",
      "Triglyceride, ethyl ester and phospholipid forms differ, but freshness makes more difference than the choice between them.",
    ],
    shelf: { category: "omega", refine: "Fish oil", label: "Omega-3 on our shelves" },
    sections: [
      {
        heading: "Oil weight versus omega-3 content",
        paragraphs: [
          "The front of a fish oil bottle usually states the weight of the oil in a softgel. The supplement facts panel states how much of that oil is EPA and DHA, the two fatty acids the product exists for. In a standard concentration, 1,000 mg of fish oil carries about 180 mg EPA and 120 mg DHA, so 300 mg of the thing you wanted and 700 mg of everything else.",
          "Concentrates change the ratio, not the arithmetic: a concentrated softgel might carry 600 mg or more of EPA plus DHA in the same 1,000 mg. Two bottles can look identical on the front and differ threefold in the panel.",
        ],
      },
      {
        heading: "How to compare two bottles",
        paragraphs: [
          "Read EPA and DHA per serving, note how many softgels a serving is, and divide. Then multiply by servings per container to see what the pack gives you in total.",
        ],
        bullets: [
          { term: "Triglyceride (rTG / TG)", detail: "The form found in fish, and in re-esterified concentrates. Generally the more expensive processing route." },
          { term: "Ethyl ester (EE)", detail: "A common concentrate form. Absorption differences reported in the literature are modest and dose-dependent." },
          { term: "Krill (phospholipid)", detail: "Lower EPA and DHA per capsule, bound differently, and priced higher per milligram of omega-3." },
          { term: "Algal oil", detail: "The vegan route, usually DHA-dominant. Check the EPA figure rather than assuming parity." },
        ],
      },
      {
        heading: "Freshness",
        paragraphs: [
          "Omega-3s oxidise. Rancid oil tastes and smells like it, and a strongly fishy burp or a bitter capsule is the practical signal most people notice first. Some manufacturers publish oxidation figures, peroxide value and TOTOX, and those are worth more than any marketing adjective. Otherwise, buy a size you will finish, keep it out of the heat, and put opened bottles in the fridge in this climate.",
          "Fish oil interacts with some medication, anticoagulants in particular. That is a conversation with a pharmacist or doctor before it is a shopping decision.",
        ],
      },
    ],
  },
  {
    slug: "protein-timing",
    tag: "Sport & protein",
    title: "Protein after training: how much, and does the timing matter?",
    dek: "The post-workout window is hours wide, not minutes. What the daily total looks like, and what a scoop is worth.",
    takeaways: [
      "Daily total does the work. Common sport-nutrition guidance lands around 1.6 g of protein per kg of body weight per day for people training seriously.",
      "The window is hours wide, not minutes. Spreading protein across the day does more than rushing a shaker straight after training.",
      "Check protein per scoop against scoop size: a 30 g scoop with 24 g of protein and a 30 g scoop with 17 g are not the same product.",
    ],
    shelf: { category: "sports", refine: "Whey protein", label: "Protein on our shelves" },
    sections: [
      {
        heading: "The daily number comes first",
        paragraphs: [
          "For someone training with weights or doing serious endurance work, sport-nutrition guidance generally lands in the region of 1.6 g of protein per kilogram of body weight per day, with a spread either side depending on who is writing and what the goal is. For a 70 kg person that is roughly 110 g a day from all sources, and a powder is a convenient way to close a gap rather than a category of its own.",
          "Timing only matters once the daily total is there. Before that it makes no difference.",
        ],
      },
      {
        heading: "What happened to the window",
        paragraphs: [
          "The idea that muscle protein synthesis is only available for thirty minutes after training has not held up. Sensitivity to protein stays raised for many hours afterwards, and a meal before training is still circulating during it. What the research does support is distribution: a portion of protein at several points across the day, rather than one large evening serving.",
          "In practice, eat a normal meal within a couple of hours of training and stop treating the shaker as a deadline. Convenience is a good reason to use a powder.",
        ],
      },
      {
        heading: "Reading a protein label",
        paragraphs: [
          "Two figures decide value: protein per scoop, and the weight of the scoop.",
        ],
        bullets: [
          { term: "Protein per scoop, against scoop weight", detail: "24 g protein in a 30 g scoop is 80% protein. 17 g in the same scoop is not." },
          { term: "Concentrate, isolate, hydrolysate", detail: "Each step is more processed, more expensive and lower in lactose. Isolate is the usual pick for lactose sensitivity." },
          { term: "Plant blends", detail: "Pea and rice together cover the amino acid profile better than either alone; check the total per scoop, which is often lower." },
          { term: "Added creatine or amino spikes", detail: "Read the panel. Filler amino acids inflate a nitrogen-based protein figure without matching food protein." },
        ],
      },
    ],
  },
];

/** 220 words a minute, floored at one — the number under a headline should not read "0 min". */
function readingTime(sections: GuideSection[]) {
  const words = sections
    .flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? []).flatMap((b) => [b.term, b.detail])])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 220)) };
}

export const GUIDES: Guide[] = SEEDS.map((seed) => ({
  ...seed,
  ...readingTime(seed.sections),
  photo: CREDITS[seed.slug] ?? null,
}));

export const guideBySlug = new Map(GUIDES.map((g) => [g.slug, g]));

export function getGuide(slug: string): Guide | undefined {
  return guideBySlug.get(slug);
}

/** The rest of the set, in order, for "more guides" placements. */
export function otherGuides(slug: string, limit = 3): Guide[] {
  return GUIDES.filter((g) => g.slug !== slug).slice(0, limit);
}

/**
 * Products to put under an article. A guide that names a shelf gets that shelf's best sellers,
 * so the rail is stock we hold rather than a wish list; one without a shelf — the COA piece,
 * which is about every product — gets the site's best sellers.
 */
export function guideProducts(guide: Guide, limit = 6): Product[] {
  if (!guide.shelf) return bestSellers(limit);
  const { category, refine } = guide.shelf;
  const inCategory = byCategory(category);
  const term = refine?.toLowerCase();
  const matched = term
    ? inCategory.filter((p) => `${p.title} ${p.form ?? ""}`.toLowerCase().includes(term))
    : inCategory;
  const pool = matched.length >= 3 ? matched : inCategory;
  return [...pool].sort((a, b) => (b.sold30d ?? 0) - (a.sold30d ?? 0)).slice(0, limit);
}

/** "Photo: Someone / Wikimedia · CC BY 4.0" — assembled from whatever the harvest recorded. */
export function creditLine(photo: PhotoCredit | null): string | null {
  if (!photo) return null;
  const who = photo.creator ?? photo.source;
  const licence =
    photo.license === "cc0"
      ? "CC0"
      : photo.license === "pdm"
        ? "Public domain"
        : photo.license
          ? `CC ${photo.license.toUpperCase()}${photo.licenseVersion ? ` ${photo.licenseVersion}` : ""}`
          : null;
  return [who, licence].filter(Boolean).join(" · ") || null;
}
