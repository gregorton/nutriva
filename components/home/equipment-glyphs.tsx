/*
  Device line art for the medical-equipment side.

  Drawn rather than photographed, and drawn at the same 1.5px stroke as `components/ui/icons.tsx`
  so the hero's second slide belongs to this site's hand rather than to a stock library. They are
  illustrations of a *range* — a blood pressure monitor, a thermometer — never of a product we
  stock, because no device has been harvested yet.
*/

export type EquipmentGlyphName = "pressure" | "thermometer" | "oximeter" | "nebuliser";

/** One range as the hero and the /equipment page both list it. */
export type EquipmentRange = {
  name: string;
  /** The figure that range is compared on, worded as a spec and not as a benefit. */
  spec: string;
  glyph: EquipmentGlyphName;
};

/**
 * The ranges we open with. Kept here rather than in `lib/` because nothing queries them: there
 * is no equipment catalogue to query yet, and these four lines are the whole of what is known.
 */
export const EQUIPMENT_RANGES: EquipmentRange[] = [
  { name: "Blood pressure monitors", spec: "Upper arm and wrist", glyph: "pressure" },
  { name: "Thermometers", spec: "Infrared and probe", glyph: "thermometer" },
  { name: "Pulse oximeters", spec: "Fingertip SpO₂", glyph: "oximeter" },
  { name: "Nebulisers", spec: "Compressor and mesh", glyph: "nebuliser" },
];

export function EquipmentGlyph({
  range,
  className = "h-10 w-10",
}: {
  range: EquipmentGlyphName;
  className?: string;
}) {
  const Glyph = GLYPHS[range];
  return <Glyph className={className} />;
}

const GLYPHS: Record<EquipmentGlyphName, (props: { className?: string }) => React.ReactElement> = {
  pressure: PressureGlyph,
  thermometer: ThermometerGlyph,
  oximeter: OximeterGlyph,
  nebuliser: NebuliserGlyph,
};

/** Upper-arm monitor: cuff wrapped left, display unit right, tube between them. */
function PressureGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <rect x="6" y="13" width="15" height="22" rx="4" />
      <path d="M10 13v22M17 13v22" opacity={0.45} />
      <rect x="27" y="17" width="15" height="14" rx="3" />
      <path d="M30.5 21.5h8M30.5 25.5h5" strokeLinecap="round" />
      <path d="M21 24h2.5c1.7 0 2.5 1.2 2.5 2.6V28" strokeLinecap="round" />
    </svg>
  );
}

/** Non-contact infrared thermometer, reading window and beam. */
function ThermometerGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M18 11h12a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H18l-4 3.5V7.5L18 11Z" strokeLinejoin="round" />
      <path d="M21 17.5h7M21 21.5h4.5" strokeLinecap="round" />
      <path d="M37 15.5c1.6 1.9 2.4 4.3 2.4 6.9s-.8 5-2.4 6.9" strokeLinecap="round" opacity={0.6} />
      <path d="M14 34.5v3.5c0 1.4 1.1 2.5 2.5 2.5h15c1.4 0 2.5-1.1 2.5-2.5v-1.5" strokeLinecap="round" opacity={0.5} />
    </svg>
  );
}

/** Fingertip oximeter: clip over a fingertip, pulse trace on the readout. */
function OximeterGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M11 15h20a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H11a2 2 0 0 1-2-2V17a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
      <path d="M25 21h8" strokeLinecap="round" opacity={0.5} />
      <path d="M12.5 27.5h3l1.5-4 2 7 1.5-3h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 33v4.5c0 1.4-1.1 2.5-2.5 2.5H21" strokeLinecap="round" opacity={0.45} />
    </svg>
  );
}

/** Compressor nebuliser: unit, tubing, mask. */
function NebuliserGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <rect x="6" y="22" width="17" height="15" rx="3" />
      <path d="M10 27.5h6" strokeLinecap="round" />
      <circle cx="19" cy="27.5" r="1.6" />
      <path d="M23 26.5c4.5 0 6.5-2.5 6.5-6" strokeLinecap="round" />
      <path d="M29.5 20.5h9l2.5 5.5-2.5 5.5h-9l-2.5-5.5 2.5-5.5Z" strokeLinejoin="round" />
      <path d="M33 24.5h3" strokeLinecap="round" opacity={0.55} />
    </svg>
  );
}
