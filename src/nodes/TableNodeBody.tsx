import { useState } from "react";
import { C, MONO } from "../theme";
import { useNodeInputs } from "../engine/core/resultsStore";
import { emitValue } from "../engine/core/engine";
import type { GraphNode } from "../types";
import { ValueTable } from "./ValueTable";

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

  return (
    <ValueTable rows={rows} maxHeight={n.h ? n.h - 30 : 216} selIdx={selIdx}
      onRowClick={(r, i) => { setSelIdx(i); emitValue(n.id, r); }} />
  );
}
