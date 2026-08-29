/*
  The dashboard's one table, set the way components/pdp/supplement-facts.tsx sets its panel:
  hairlines on every cell, `scope` on every header, the row's own label as `th scope="row"` at
  normal weight, `data-num` on figures so they align in their column, and an em dash where there
  is nothing — never a zero standing in for a missing value.

  The first cell of each row is the row header. Everything after it is data, and everything from
  `numericFrom` on is a figure — `data-num` only where it belongs, so an email is not set in
  tabular numerals to line up with nothing.
*/
export function RankTable({
  columns,
  rows,
  empty,
  caption,
  numericFrom = 1,
}: {
  columns: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
  empty: string;
  caption?: string;
  numericFrom?: number;
}) {
  if (rows.length === 0) return <p className="facts">{empty}</p>;

  return (
    <table className="w-full border-collapse border border-line text-left">
      {caption && (
        <caption className="caption-top pb-2 text-left">
          <span className="kicker text-muted">{caption}</span>
        </caption>
      )}
      <thead>
        <tr className="bg-paper-warm">
          {columns.map((column, index) => (
            <th
              key={column}
              scope="col"
              className={`border border-line px-3 py-2 text-[12px] font-semibold ${index === 0 ? "" : "w-px whitespace-nowrap"}`}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-[13px]">
        {rows.map((row) => (
          <tr key={row.key} className="align-top">
            {row.cells.map((cell, index) =>
              index === 0 ? (
                <th key={index} scope="row" className="border border-line px-3 py-2 font-normal">
                  {cell ?? "—"}
                </th>
              ) : (
                <td
                  key={index}
                  className="border border-line px-3 py-2 whitespace-nowrap"
                  data-num={index >= numericFrom ? "" : undefined}
                >
                  {cell ?? "—"}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
