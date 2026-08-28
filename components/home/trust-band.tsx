/**
 * Professional Brands intro — exact-copy refactor of the captured
 * `div.professional-brands-intro` (iHerb Speciality Store).
 *
 * Preserves observed composition, hierarchy, spacing, typography and
 * color logic while converting fixed 1376×316 capture dimensions to
 * fluid responsive constraints and consolidating tokens for maintainability.
 *
 * Assets are the listed source assets, reused with original crops.
 */

const CARDS = [
  {
    icon: "https://s3.images-iherb.com/cms/images/SpecialtyStore/Laboratory.svg",
    alt: "",
    text: "Ingredients that have been studied in the scientific literature",
  },
  {
    icon: "https://s3.images-iherb.com/cms/images/SpecialtyStore/Authentic.svg",
    alt: "",
    text: "Manufacturing that follows industry standards such as cGMP",
  },
  {
    icon: "https://s3.images-iherb.com/cms/images/SpecialtyStore/Accurate%20Label.svg",
    alt: "",
    text: "Labels that state where the ingredients came from",
  },
  {
    icon: "https://s3.images-iherb.com/cms/images/SpecialtyStore/Experts.svg",
    alt: "",
    text: "Brands that work with healthcare practitioners",
  },
] as const;

export function TrustBand() {
  return (
    <section className="shell mt-6" aria-labelledby="professional-brands-heading">
      {/* The banner ramp itself lives in globals.css — the home hero's equipment slide and the
          /equipment page read the same three stops, so this blue means one thing site-wide. */}
      <div className="banner-clinic relative flex flex-col items-center overflow-hidden rounded-t-[8px] p-8">

        <div className="w-full max-w-[1312px]">
          {/* header */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <img
                  src="https://s3.images-iherb.com/cms/images/SpecialtyStore/Professional.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 object-contain"
                  loading="lazy"
                />
                <h2
                  id="professional-brands-heading"
                  className="ml-2 max-w-[792px] text-[32px] font-bold leading-10 text-white"
                >
                  Professional Brands
                </h2>
              </div>
            </div>
            <p className="max-w-[840px] text-[16px] font-normal leading-6 text-white">
              The professional shelf holds brands that sell mainly through clinics and
              practitioners. What they tend to have in common:
            </p>
          </div>

          {/* cards */}
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {CARDS.map((card) => (
              <li
                key={card.text}
                className="flex min-h-[96px] flex-1 items-center gap-3 rounded-[12px] bg-white px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <img
                    src={card.icon}
                    alt={card.alt}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                    loading="lazy"
                  />
                </span>
                <p className="flex-1 text-[16px] font-normal leading-6 text-[#181b1f]">{card.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Reusable alias — keeps brief naming while preserving existing import. */
export const ProfessionalBrandsIntro = TrustBand;
