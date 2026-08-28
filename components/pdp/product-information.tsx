import type { Product } from "@/lib/catalog";
import {
  DISCLAIMER,
  otherIngredients,
  overviewParagraphs,
  overviewPoints,
  specifications,
  storage,
  suggestedUse,
  supplementFacts,
  warnings,
} from "@/lib/product-info";
import { SupplementFacts } from "@/components/pdp/supplement-facts";

/*
  Product information — one dedicated section carrying everything that used to sit squeezed
  beside the buy box: overview, specifications, dosage, ingredients, warnings, storage,
  disclaimer, and the supplement-facts panel in its own column.

  The copy is the manufacturer's, block for block, in the order a pack reads. Blocks whose
  source states nothing are dropped rather than padded — a product with no "other ingredients"
  line simply has no such heading.

  Composition follows the reference site's `content-wrapper`: a tinted title bar over a
  fourteen-to-ten column split, each block a hairline-free "item row" with a 17px heading over
  14px/21px body copy. The section frame is a single hairline, as there.
*/

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-3">
      <h3 className="font-display text-[17px] leading-snug">{title}</h3>
      <div className="mt-1.5 space-y-3 text-[14px] leading-[1.5]">{children}</div>
    </section>
  );
}

function Paragraphs({ lines }: { lines: string[] }) {
  return lines.map((line) => <p key={line}>{line}</p>);
}

export function ProductInformation({ product }: { product: Product }) {
  const points = overviewPoints(product);
  const paragraphs = overviewParagraphs(product);
  const specs = specifications(product);
  const ingredients = otherIngredients(product);
  const facts = supplementFacts(product);

  return (
    <section id="product-information" className="mt-14 rounded-tile border border-line">
      <div className="rounded-t-tile border-b border-line bg-paper px-5 py-3">
        <h2 className="text-[20px] sm:text-[22px]">Product information</h2>
      </div>

      <div
        className={`grid grid-cols-1 gap-x-10 gap-y-2 px-5 pb-6 pt-2 ${
          facts ? "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""
        }`}
      >
        <div className="min-w-0 divide-y divide-line">
          {(points.length > 0 || paragraphs.length > 0) && (
            <Block title="Overview">
              {points.length > 0 && (
                <ul className="ml-4 list-disc space-y-1.5">
                  {points.map((point) => (
                    <li key={point} data-num>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
              <Paragraphs lines={paragraphs} />
            </Block>
          )}

          <Block title="Specifications">
            <ul className="space-y-1.5">
              {specs.map((spec) => (
                <li key={spec.label} className="flex flex-wrap gap-x-1.5">
                  <span className="text-muted">{spec.label}:</span>
                  <span className="font-medium" data-num>
                    {spec.value}
                  </span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Suggested use">
            <Paragraphs lines={suggestedUse(product)} />
          </Block>

          {ingredients.length > 0 && (
            <Block title="Other ingredients">
              <Paragraphs lines={ingredients} />
            </Block>
          )}

          <Block title="Warnings">
            <Paragraphs lines={warnings(product)} />
          </Block>

          <Block title="Storage">
            <Paragraphs lines={storage(product)} />
          </Block>

          <section className="py-3">
            <h3 className="kicker text-muted">Disclaimer</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{DISCLAIMER}</p>
          </section>
        </div>

        {facts && (
          <div className="min-w-0 pt-3">
            <SupplementFacts product={product} />
          </div>
        )}
      </div>
    </section>
  );
}
