import { useEffect } from "react";
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
    <div className="text-pane">
      <textarea className="text-ta"
        value={n.code ?? ""}
        placeholder="text…"
        spellCheck={false}
        onChange={(e) => useGraphStore.getState().updateCode(n.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
