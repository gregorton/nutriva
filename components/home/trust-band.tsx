/**
 * Professional Brands intro — exact-copy refactor of the captured
 * `div.professional-brands-intro` (iHerb Speciality Store).
 *
 * Preserves observed composition, hierarchy, spacing, typography and
 * color logic while converting fixed 1376×316 capture dimensions to
 * fluid responsive constraints and consolidating tokens for maintainability.
 *
 * The one departure from the capture: the five glyphs are drawn here rather than
 * hotlinked off `s3.images-iherb.com`, which put a third party in the render path
 * and shipped their assets. Same shapes, same weights, our line art.
 */

const CARDS = [
  { icon: FlaskGlyph, text: "Ingredients that have been studied in the scientific literature" },
  { icon: ShieldGlyph, text: "Manufacturing that follows industry standards such as cGMP" },
  { icon: LabelGlyph, text: "Labels that state where the ingredients came from" },
  { icon: PractitionerGlyph, text: "Brands that work with healthcare practitioners" },
] as const;

export function TrustBand() {
  return (
    <section className="shell mt-6" aria-labelledby="professional-brands-heading">
      {/* The banner ramp itself lives in globals.css — the home hero's equipment slide and the
          /equipment page read the same three stops, so this blue means one thing site-wide. */}
      <div className="banner-clinic relative flex flex-col items-center overflow-hidden rounded-tile p-8">

        <div className="w-full max-w-[1312px]">
          {/* header */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <BadgeGlyph className="h-9 w-9 shrink-0 text-white" />
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
            {CARDS.map(({ icon: Glyph, text }) => (
              <li
                key={text}
                className="flex min-h-[96px] flex-1 items-center gap-3 rounded-[12px] bg-white px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <Glyph className="h-8 w-8 text-clinic-700" />
                </span>
                <p className="flex-1 text-[16px] font-normal leading-6 text-[#181b1f]">{text}</p>
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

/*
  The glyphs. One 24 grid and one stroke weight across all five, so the section mark and the four
  card marks read as one family; `components/ui/icons.tsx` has no provenance, practitioner or
  rosette shape and none of these is wanted anywhere else yet.
*/
type GlyphProps = { className?: string };

const glyph = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6 } as const;

/** Section mark: a check in a rosette over a ribbon tail. */
function BadgeGlyph({ className }: GlyphProps) {
  return (
    <svg {...glyph} className={className} aria-hidden>
      <circle cx="12" cy="9.4" r="6.4" />
      <path d="m8.9 9.5 2.1 2.1 3.9-4.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.9 14.9 6.2 21.4l5.8-2.8 5.8 2.8-1.7-6.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Studied in the literature — a conical flask with its liquid line. */
function FlaskGlyph({ className }: GlyphProps) {
  return (
    <svg {...glyph} className={className} aria-hidden>
      <path d="M9.5 3h5v5.2l4.4 8.9a2.4 2.4 0 0 1-2.2 3.4H7.3a2.4 2.4 0 0 1-2.2-3.4L9.5 8.2V3Z" strokeLinejoin="round" />
      <path d="M7.6 13.8h8.8" strokeLinecap="round" />
    </svg>
  );
}

/** cGMP and the like — a shield, checked. */
function ShieldGlyph({ className }: GlyphProps) {
  return (
    <svg {...glyph} className={className} aria-hidden>
      <path d="M12 3l7 2.5v6c0 4.3-2.9 7.7-7 9.5-4.1-1.8-7-5.2-7-9.5v-6L12 3Z" strokeLinejoin="round" />
      <path d="m8.9 11.8 2.4 2.4 4-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Where the ingredients came from — a label plate with two written lines. */
function LabelGlyph({ className }: GlyphProps) {
  return (
    <svg {...glyph} className={className} aria-hidden>
      <path d="M4 7.6a2 2 0 0 1 2-2h8.8a2 2 0 0 1 1.6.8l3.2 4.2a1.5 1.5 0 0 1 0 1.8l-3.2 4.2a2 2 0 0 1-1.6.8H6a2 2 0 0 1-2-2V7.6Z" strokeLinejoin="round" />
      <path d="M7.4 10.6h6.4M7.4 13.8h4.2" strokeLinecap="round" />
    </svg>
  );
}

/** Healthcare practitioners — a figure with a cross at the chest. */
function PractitionerGlyph({ className }: GlyphProps) {
  return (
    <svg {...glyph} className={className} aria-hidden>
      <circle cx="12" cy="6.6" r="3" />
      <path d="M5.4 20.4c0-3.6 2.9-6.6 6.6-6.6s6.6 3 6.6 6.6" strokeLinecap="round" />
      <path d="M12 16.6v4M10 18.6h4" strokeLinecap="round" opacity={0.55} />
    </svg>
  );
}
