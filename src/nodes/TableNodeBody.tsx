import { useState } from "react";
import { useNodeInputs } from "../engine/core/resultsStore";
import { emitValue } from "../engine/core/engine";
import type { GraphNode } from "../types";
import { ValueTable } from "./ValueTable";
import { Waiting } from "./Waiting";

/** Table built-in: renders the `rows` input (an array); clicking a row emits
 *  it from the node's "→" port — the table is the picker (natto's model). */
export function TableNodeBody({ node: n }: { node: GraphNode }) {
  const inputs = useNodeInputs(n.id);
  const rows = inputs?.rows;
  const [selIdx, setSelIdx] = useState(-1);

  if (!Array.isArray(rows) || rows.length === 0) {
    // wired but valueless means upstream is still working — spin, don't sit
    // there looking like an empty table (#9)
    const wired = !!inputs && "rows" in inputs;
    return (
      <Waiting
        busy={wired && rows === undefined}
        msg={
          Array.isArray(rows)
            ? "rows · empty"
            : wired
              ? "rows · waiting for data"
              : "rows · waiting for an array"
        }
      />
    );
  }

  return (
    <ValueTable
      rows={rows}
      maxHeight={n.h ? n.h - 30 : 216}
      selIdx={selIdx}
      onRowClick={(r, i) => {
        setSelIdx(i);
        emitValue(n.id, r);
      }}
    />
  );
}
