import { useState } from "react";
import { C, MONO } from "../theme";
import { useNodeInputs } from "../engine/core/resultsStore";
import { emitValue } from "../engine/core/engine";
import type { GraphNode } from "../types";

const MAX_ROWS = 100;
const MAX_COLS = 6;

/** Table built-in: renders the `rows` input (an array); clicking a row emits
 *  it from the node's "→" port — the table is the picker (natto's model). */
export function TableNodeBody({ node: n }: { node: GraphNode }) {
  const rows = useNodeInputs(n.id)?.rows;
  const [selIdx, setSelIdx] = useState(-1);

  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 10.5, color: C.faint }}>
        rows · waiting for an array
      </div>
    );
  }

  // columns = union of keys across the first few object rows; non-object rows
  // (numbers, strings) render as a single value column
  const cols: string[] = [];
  for (const r of rows.slice(0, 5)) {
    if (r && typeof r === "object" && !Array.isArray(r)) {
      for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    }
  }
  cols.splice(MAX_COLS);
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div style={{ overflow: "auto", maxHeight: n.h ? n.h - 30 : 216, borderRadius: "0 0 4px 4px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: MONO, fontSize: 10.5 }}>
        {cols.length > 0 && (
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} style={{ position: "sticky", top: 0, background: C.headBg, textAlign: "left",
                  padding: "4px 8px", color: C.dim, fontWeight: 500, whiteSpace: "nowrap" }}>{c}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} onClick={() => { setSelIdx(i); emitValue(n.id, r); }}
              style={{ cursor: "pointer", background: i === selIdx ? C.selSoft : "transparent" }}>
              {cols.length > 0 ? (
                cols.map((c) => (
                  <td key={c} style={{ padding: "3px 8px", borderTop: `1px solid ${C.edge}`, color: C.ink,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
                    {cell((r as Record<string, unknown>)[c])}
                  </td>
                ))
              ) : (
                <td style={{ padding: "3px 8px", borderTop: `1px solid ${C.edge}`, color: C.ink,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cell(r)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_ROWS && (
        <div style={{ padding: "3px 8px", fontFamily: MONO, fontSize: 9.5, color: C.faint }}>
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
