// Bridges the graph doc to the runtime state the canvas surface reads. Runtime
// state lives in a ref (outside React) so engine ticks never re-render chrome —
// the pattern ENGINE.md mandates for the real engine.

import { useEffect, useMemo, useRef } from "react";
import { pyResult } from "./inference/index";
import { outsOf } from "../graph/geometry";
import type { Edge, LiveState, NodeMap, NodeResult } from "../types";

export function useLiveRuntime(nodes: NodeMap, edges: Edge[]) {
  const live = useRef<LiveState>({ count: 40, rendered: true, cursor: null, t: 0 });

  // count node's value feeds the live walker count
  const countRes = useMemo<NodeResult>(() => pyResult(nodes.count?.code ?? ""), [nodes.count?.code]);
  useEffect(() => {
    live.current.count = Math.max(0, Math.min(600, parseInt(countRes.v ?? "0", 10) || 0));
  }, [countRes]);

  // the screen renders only while a valid renderer is wired into `render`
  useEffect(() => {
    live.current.rendered = !!nodes.parts && !!nodes.cvs && edges.some((e) =>
      e.to[0] === "cvs" && e.to[1] === "render" && nodes[e.from[0]] &&
      (e.from[1] === "→" || outsOf(nodes[e.from[0]]!).some((o) => o.name === e.from[1])));
  }, [nodes, edges]);

  return { live, countRes };
}
