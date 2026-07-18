import type { GraphNode } from "../types";

/** Source built-ins (tick, pointer): stream sources, arriving with the
 *  engine's stream phase. Static placeholders until then — the canvas hands
 *  its renderer timing and pointer directly, so nothing depends on these. */
export function SourceNodeBody({ node }: { node: GraphNode }) {
  return (
    <div className="bipane tight">
      {node.kind === "tick" ? (
        <div className="dim">
          interval <span className="ink">16ms ▾</span>
        </div>
      ) : (
        <div className="dim">
          surface <span className="ink">{node.target} ▾</span>
        </div>
      )}
      <div className="lbl">stream · coming with the stream phase</div>
    </div>
  );
}
