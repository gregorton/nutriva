/*
  The console's one table, keeping the conventions components/pdp/supplement-facts.tsx sets: hairlines
  on every cell, `scope` on every header, the row's own label as `th scope="row"` at normal weight,
  `data-num` on figures so they align in their column, and an em dash where there is nothing — never a
  zero standing in for a missing value.

  The first cell of each row is the row header. Everything after it is data, and everything from
  `numericFrom` on is a figure, so an email is not set in tabular numerals to line up with nothing.
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
  return (
    <div>
      {caption && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-term-dim uppercase">
          <span className="text-term-cyan" aria-hidden>
            ▸
          </span>
          {caption}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-term-line px-3 py-3 text-[12px] text-term-dim">
          {empty}
        </p>
      ) : (
        <table className="w-full border-collapse border border-term-line text-left">
          <thead>
            <tr className="bg-term-800">
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={`border border-term-line px-3 py-2 text-[10.5px] font-normal tracking-[0.1em] text-term-dim uppercase ${
                    index === 0 ? "" : "w-px whitespace-nowrap"
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[12.5px]">
            {rows.map((row) => (
              <tr key={row.key} className="align-top transition-colors hover:bg-term-900">
                {row.cells.map((cell, index) =>
                  index === 0 ? (
                    <th
                      key={index}
                      scope="row"
                      className="border border-term-line px-3 py-2 font-normal text-term-text"
                    >
                      {cell ?? "—"}
                    </th>
                  ) : (
                    <td
                      key={index}
                      className="border border-term-line px-3 py-2 whitespace-nowrap text-term-dim"
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
      )}
    </div>
  );
}
