const MAX_ROWS = 100;
const MAX_COLS = 6;

interface ValueTableProps {
  rows: unknown[];
  maxHeight: number;
  selIdx?: number;
  onRowClick?: (row: unknown, i: number) => void;
}

/** Presentational table over an array: columns are the union of keys across
 *  the first few object rows; non-object rows render as a single value column.
 *  Shared by the table built-in (row click emits) and the table render mode
 *  (row click calls the value's onRowClick). */
export function ValueTable({ rows, maxHeight, selIdx = -1, onRowClick }: ValueTableProps) {
  const cols: string[] = [];
  for (const r of rows.slice(0, 5)) {
    if (r && typeof r === "object" && !Array.isArray(r)) {
      for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    }
  }
  cols.splice(MAX_COLS);
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="vtable-wrap" style={{ maxHeight }}>
      <table className="vtable">
        {cols.length > 0 && (
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} onClick={() => onRowClick?.(r, i)}
              className={`${onRowClick ? "click" : ""}${i === selIdx ? " sel" : ""}`}>
              {cols.length > 0 ? (
                cols.map((c) => (
                  <td key={c} className="vmax">
                    {cell((r as Record<string, unknown>)[c])}
                  </td>
                ))
              ) : (
                <td>{cell(r)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_ROWS && (
        <div className="vtable-more">
          + {rows.length - MAX_ROWS} more
        </div>
      )}
    </div>
  );
}

function cell(v: unknown): string {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  try {
    const s = JSON.stringify(v) ?? "";
    return s.length > 40 ? s.slice(0, 39) + "…" : s;
  } catch {
    return String(v);
  }
}
