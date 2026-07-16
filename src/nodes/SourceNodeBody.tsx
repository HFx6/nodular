import { C, MONO } from "../theme";
import type { GraphNode } from "../types";

/** Source built-ins (tick, pointer): stream sources, arriving with the
 *  engine's stream phase. Static placeholders until then — the canvas hands
 *  its renderer timing and pointer directly, so nothing depends on these. */
export function SourceNodeBody({ node }: { node: GraphNode }) {
  return (
    <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, display: "grid", gap: 5 }}>
      {node.kind === "tick" ? (
        <div style={{ color: C.dim }}>interval <span style={{ color: C.ink }}>16ms ▾</span></div>
      ) : (
        <div style={{ color: C.dim }}>surface <span style={{ color: C.ink }}>{node.target} ▾</span></div>
      )}
      <div style={{ color: C.faint, fontSize: 10 }}>stream · coming with the stream phase</div>
    </div>
  );
}
