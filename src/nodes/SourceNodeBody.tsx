import type { RefObject } from "react";
import { C, MONO } from "../theme";
import { useLiveTick } from "../engine/useLiveTick";
import type { GraphNode, LiveState } from "../types";

/** Source built-ins (tick, pointer): reference a surface by setting, emit a
 *  stream from their `→` port. Bodies sample the runtime ref on a local tick so
 *  only these nodes re-render, not the board. */
export function SourceNodeBody({ node, live }: { node: GraphNode; live: RefObject<LiveState> }) {
  const t = useLiveTick(live);
  return (
    <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, display: "grid", gap: 5 }}>
      {node.kind === "tick" ? (<>
        <div style={{ color: C.dim }}>interval <span style={{ color: C.ink }}>16ms ▾</span></div>
        <div style={{ color: C.faint, fontSize: 10 }}>t · <span style={{ color: C.dim }}>{t}</span></div>
      </>) : (<>
        <div style={{ color: C.dim }}>surface <span style={{ color: C.ink }}>{node.target} ▾</span></div>
        <div style={{ color: C.faint, fontSize: 10 }}>last · <span style={{ color: C.dim }}>{live.current.cursor ? `${Math.round(live.current.cursor.x)}, ${Math.round(live.current.cursor.y)}` : "outside"}</span></div>
      </>)}
    </div>
  );
}
