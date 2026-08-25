import type { Product } from "@/lib/catalog";
import { dietClaims, keyInfo, qualityStandards, type ClaimIconKey } from "@/lib/product-info";
import {
  CheckIcon,
  CircleSlashIcon,
  FlaskIcon,
  GrainIcon,
  HexBadgeIcon,
  LeafIcon,
  OctagonBadgeIcon,
  ShieldIcon,
  SproutIcon,
  SunIcon,
} from "@/components/ui/icons";

/*
  At a glance — the reference site's three stacked panels beside the buy box: key info,
  certifications and diet, quality standards. Same composition and reading order; the marks are
  our own line icons in plum rather than the reference's filled green ones.

  Both claim panels read the label's own marks, so the set is open-ended. A mark we have an icon
  for gets it; anything else gets the generic check rather than being dropped, because the claim
  is on the pack either way. A product declaring nothing loses the panel entirely.
*/

const CLAIM_ICONS: Record<ClaimIconKey, (props: { className?: string }) => React.ReactElement> = {
  vegan: SproutIcon,
  vegetarian: LeafIcon,
  "non-gmo": CircleSlashIcon,
  organic: SunIcon,
  "gluten-free": GrainIcon,
  kosher: HexBadgeIcon,
  halal: OctagonBadgeIcon,
  tested: FlaskIcon,
  badge: CheckIcon,
};

const PANEL_HEADING = "font-sans text-[15px] font-semibold tracking-normal text-ink";

export function AtAGlance({ product }: { product: Product }) {
  const facts = keyInfo(product);
  const claims = dietClaims(product);
  const standards = qualityStandards(product);

  return (
    <section className="rounded-card border border-line" aria-label="Product at a glance">
      {facts.length > 0 && (
        <div className="p-4">
          <h2 className={PANEL_HEADING}>Key info</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="facts">{fact.label}</dt>
                <dd className="mt-0.5 text-[14px] font-semibold text-ink" data-num>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {claims.length > 0 && (
        <div className="border-t border-line p-4 first:border-t-0">
          <h2 className={PANEL_HEADING}>Certifications and diet</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {claims.map((claim) => {
              const Icon = CLAIM_ICONS[claim.icon];
              return (
                <li key={claim.key} className="flex items-center gap-2">
                  <Icon className="h-6 w-6 shrink-0 text-plum-700" />
                  <span className="text-[13px] font-medium text-ink">{claim.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="border-t border-line p-4 first:border-t-0">
        <h2 className={PANEL_HEADING}>Quality standards &amp; manufacturing</h2>
        <ul className="mt-2 divide-y divide-line">
          {standards.map((standard) => (
            <li key={standard.label} className="flex items-center gap-3 py-2.5 last:pb-0">
              <ShieldIcon className="h-6 w-6 shrink-0 text-plum-700" />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-snug text-ink">
                  {standard.label}
                </span>
                <span className="facts block">{standard.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
