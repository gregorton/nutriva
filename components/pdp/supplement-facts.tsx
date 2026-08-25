import type { Product } from "@/lib/catalog";
import { supplementFacts } from "@/lib/product-info";

/*
  Supplement facts, set as the reference site sets it: a hairline-ruled table, the heading inside
  the frame, serving size and servings per container spanning the full width above the column
  heads, then one row per labelled active.

  Every figure here is the manufacturer's, %DV included. Where a label prints no daily value for
  an ingredient — most botanicals have none established — the cell shows an em dash and the
  footnote says why, which is exactly what the pack does. Products whose page carries no panel
  at all render nothing.
*/
export function SupplementFacts({ product }: { product: Product }) {
  const facts = supplementFacts(product);
  if (!facts) return null;

  const anyDailyValue = facts.rows.some((row) => row.dailyValue);

  return (
    <section aria-label="Supplement facts">
      <table className="w-full border-collapse border border-ink text-left">
        <caption className="caption-top border border-b-0 border-ink bg-paper-warm px-3 py-2 text-left">
          <span className="font-display text-[17px] font-semibold text-ink">Supplement facts</span>
        </caption>
        <tbody className="text-[13px]">
          {facts.servingSize && (
            <tr>
              <td colSpan={3} className="border border-line-strong px-3 py-1.5">
                <strong className="font-semibold">Serving size:</strong>{" "}
                <span data-num>{facts.servingSize}</span>
              </td>
            </tr>
          )}
          {facts.servingsPerContainer && (
            <tr>
              <td colSpan={3} className="border border-line-strong px-3 py-1.5">
                <strong className="font-semibold">Servings per container:</strong>{" "}
                <span data-num>{facts.servingsPerContainer}</span>
              </td>
            </tr>
          )}
          <tr className="border-y-2 border-ink">
            <th scope="col" className="w-[58%] border border-line-strong px-3 py-1.5" />
            <th scope="col" className="border border-line-strong px-3 py-1.5 font-semibold">
              Amount per serving
            </th>
            <th scope="col" className="border border-line-strong px-3 py-1.5 font-semibold">
              % Daily value
            </th>
          </tr>
          {facts.rows.map((row, i) => (
            <tr key={`${row.name}-${i}`} className="align-top">
              <th scope="row" className="border border-line-strong px-3 py-2 font-normal">
                {row.name}
              </th>
              <td className="border border-line-strong px-3 py-2 font-semibold" data-num>
                {row.amount}
              </td>
              <td className="border border-line-strong px-3 py-2 text-faint" data-num>
                {row.dailyValue ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {facts.footnotes.length > 0 ? (
        <div className="mt-2 space-y-1">
          {facts.footnotes.map((note) => (
            <p key={note} className="facts">
              {note}
            </p>
          ))}
        </div>
      ) : (
        <p className="facts mt-2">
          {anyDailyValue
            ? "Daily values as printed on the manufacturer's label, based on a 2,000-calorie diet."
            : "No daily value established for the ingredients in this formula."}
        </p>
      )}
    </section>
  );
}
