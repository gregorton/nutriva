import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { price } from "@/lib/format";
import { packLabel } from "@/lib/product-info";
import { QuickAdd } from "@/components/cart/quick-add";
import { Stars } from "@/components/ui/stars";

/*
  Products as columns, label rows as rows.

  The supplement-facts rows are the union of the names each label prints, in the order the first
  product prints them and then whatever the others add. A product that does not state a row gets a
  dash — never a zero, which would be a claim its label does not make. Same rule the product page
  holds to when a panel renders nothing.

  A real table, so a row label is a `th` with a row scope and the columns are readable out of order.
  It scrolls sideways below the point where four columns fit rather than reflowing, because a
  comparison that stacks is not a comparison.
*/

type Cell = string | { amount: string; note: string | null } | null;
type Row = { label: string; cells: Cell[]; numeric?: boolean };

/** Width of the row-label column. The rest is split evenly between the products. */
const LABEL_PERCENT = 20;

function packRows(products: Product[]): Row[] {
  const rows: Row[] = [
    { label: "Pack size", cells: products.map((p) => packLabel(p)), numeric: true },
    { label: "Format", cells: products.map((p) => p.form) },
    { label: "Serving size", cells: products.map((p) => p.servingSize), numeric: true },
    {
      label: "Servings per container",
      cells: products.map((p) => (p.servings ? String(p.servings) : null)),
      numeric: true,
    },
    { label: "Best by", cells: products.map((p) => p.bestBy), numeric: true },
    {
      label: "Marks on the label",
      cells: products.map((p) => (p.certifications.length ? p.certifications.join(", ") : null)),
    },
  ];
  // A row no product states tells the reader nothing.
  return rows.filter((row) => row.cells.some((cell) => cell));
}

/*
  Two labels can print the same nutrient under different wording — "Magnesium (elemental) (from
  2,000 mg Magnesium Bisglycinate)" against "Magnesium (from 2,000 mg magnesium lysinate glycinate
  chelate)". Keying rows on the printed string put those on two rows with a dash each, which is
  honest and useless. Rows are keyed on the nutrient — everything before the first bracket — and each
  cell keeps its own label's wording underneath, so the comparison lines up without rewriting a label.
*/
function nutrientKey(name: string): string {
  return name.split("(")[0].replace(/[\s,·]+$/, "").trim().toLowerCase();
}

/** The qualifier a label adds after the nutrient: "(from 2,000 mg Magnesium Bisglycinate)". */
function qualifier(name: string): string | null {
  const bracket = name.indexOf("(");
  return bracket > 0 ? name.slice(bracket).trim() : null;
}

function factsRows(products: Product[]): Row[] {
  const keys: string[] = [];
  const labels = new Map<string, string>();

  for (const product of products) {
    for (const row of product.supplementFacts?.rows ?? []) {
      const key = nutrientKey(row.name);
      if (!key) continue;
      if (!keys.includes(key)) {
        keys.push(key);
        labels.set(key, row.name.split("(")[0].replace(/[\s,·]+$/, "").trim() || row.name);
      }
    }
  }

  return keys.map((key) => ({
    label: labels.get(key) ?? key,
    numeric: true,
    cells: products.map((product) => {
      const row = product.supplementFacts?.rows.find((entry) => nutrientKey(entry.name) === key);
      if (!row) return null;
      const amount = row.dailyValue ? `${row.amount} · ${row.dailyValue} DV` : row.amount;
      return { amount, note: qualifier(row.name) };
    }),
  }));
}

export function CompareTable({ products }: { products: Product[] }) {
  const pack = packRows(products);
  const facts = factsRows(products);
  // `table-fixed` plus explicit column widths, or the columns size to their content and a product
  // shot expands to fill the page. `col` takes a length or a percentage — not `minmax()`.
  const columnWidth = `${(100 - LABEL_PERCENT) / products.length}%`;

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full table-fixed border-collapse text-[13px]"
        style={{ minWidth: `${160 + products.length * 190}px` }}
      >
        <caption className="sr-only">
          {products.length} products compared on pack data and supplement facts
        </caption>

        <colgroup>
          <col style={{ width: `${LABEL_PERCENT}%` }} />
          {products.map((product) => (
            <col key={product.slug} style={{ width: columnWidth }} />
          ))}
        </colgroup>

        <thead>
          <tr>
            <td className="align-bottom" />
            {products.map((product) => (
              <th key={product.slug} scope="col" className="border-b border-line p-3 align-bottom text-left">
                <Link href={`/p/${product.slug}`} className="group block">
                  <span className="relative block aspect-square max-h-44 overflow-hidden rounded-[7px] bg-paper">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-contain p-2"
                    />
                  </span>
                  <span className="facts mt-2 block truncate text-plum-700">{product.brand}</span>
                  <span className="mt-0.5 line-clamp-3 block text-[13px] font-medium leading-snug text-ink group-hover:text-plum-700">
                    {product.title}
                  </span>
                </Link>

                <span className="mt-2 block">
                  <Stars value={product.rating} />
                </span>

                <span
                  className={`mt-2 block text-[16px] font-semibold ${
                    product.discount ? "text-sale-600" : "text-ink"
                  }`}
                  data-num
                >
                  {price(product.price)}
                </span>

                <span className="mt-2 block font-normal">
                  {product.inStock ? (
                    <QuickAdd slug={product.slug} />
                  ) : (
                    <span className="facts block py-2 text-muted">Out of stock</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <Section heading="The pack" rows={pack} span={products.length} />
        {facts.length > 0 && (
          <Section heading="Supplement facts, as each label prints them" rows={facts} span={products.length} />
        )}
      </table>
    </div>
  );
}

function Section({ heading, rows, span }: { heading: string; rows: Row[]; span: number }) {
  return (
    <tbody className="border-b border-line">
      <tr>
        <th
          scope="colgroup"
          colSpan={span + 1}
          className="bg-paper-warm px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-plum-800"
        >
          {heading}
        </th>
      </tr>

      {rows.map((row) => (
        <tr key={row.label} className="border-t border-line">
          <th scope="row" className="bg-paper px-3 py-2.5 text-left align-top font-medium text-ink">
            {row.label}
          </th>
          {row.cells.map((cell, i) => (
            <td
              key={i}
              className={`px-3 py-2.5 align-top ${cell ? "text-ink" : "text-faint"}`}
              {...(row.numeric ? { "data-num": "" } : {})}
            >
              {typeof cell === "string" ? (
                cell
              ) : cell ? (
                <>
                  {cell.amount}
                  {cell.note && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-faint">{cell.note}</span>
                  )}
                </>
              ) : (
                "—"
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
