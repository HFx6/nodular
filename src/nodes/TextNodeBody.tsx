import { useEffect } from "react";
import { C, MONO } from "../theme";
import { emitValue } from "../engine/core/engine";
import { useGraphStore } from "../graph/store";
import type { GraphNode } from "../types";

/** text built-in: the editor value IS the value (natto's text pane). Emits
 *  n.code on "→" on mount and every edit — a string emit is as cheap as a
 *  code-node keystroke, so no debounce. */
export function TextNodeBody({ node: n }: { node: GraphNode }) {
  useEffect(() => {
    emitValue(n.id, n.code ?? "");
  }, [n.code, n.id]);

  return (
    <div style={{ padding: 8 }}>
      <textarea
        value={n.code ?? ""}
        placeholder="text…"
        spellCheck={false}
        onChange={(e) => useGraphStore.getState().updateCode(n.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ fontFamily: MONO, fontSize: 11.5, lineHeight: 1.5, padding: "5px 7px", borderRadius: 4,
          border: `1px solid ${C.edge}`, background: C.pane, color: C.ink, outline: "none", resize: "none",
          width: "100%", minHeight: 64, boxSizing: "border-box", display: "block" }}
      />
    </div>
  );
}
