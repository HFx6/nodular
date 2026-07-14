import { useMemo, useState } from "react";

/* nodular — mockup v4. Conceptual demo: a random-walk particle field.
   Engine faked; interactions real: in-node editing (count → live walker count),
   export inference (delete draw → screen loses its renderer), pan/zoom board,
   node collapse/delete, click-to-wire, hover samples.

   Composition root only. State/behaviour live in hooks; rendering in ui/ and
   nodes/. See files/PROJECT.md and files/ENGINE.md for the target architecture. */

import { C, SANS } from "./theme";
import type { NodeResult, View } from "./types";
import { useToast } from "./hooks/useToast";
import { useGraph } from "./graph/useGraph";
import { useLiveRuntime } from "./engine/useLiveRuntime";
import { GlobalStyles } from "./ui/GlobalStyles";
import { TopBar } from "./ui/TopBar";
import { Board } from "./ui/board/Board";
import { EditorRail } from "./ui/rail/EditorRail";

export default function App() {
  const { note, say } = useToast();
  const { nodes, edges, sel, arm, actions, addNode, moveNode, disarm, updateCode } = useGraph(say);
  const { live, countRes } = useLiveRuntime(nodes, edges);

  const [rail, setRail] = useState(false);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });

  // inferred node values feeding the result strips
  const results = useMemo<Record<string, NodeResult>>(() => ({
    count: countRes,
    parts: { v: null, why: "module — exports carry the value" },
    noise: { v: null, why: "module of defs" },
  }), [countRes]);

  const selNode = nodes[sel];

  return (
    <div style={{ fontFamily: SANS, width: "100%", height: "100dvh", minHeight: 480, display: "flex", flexDirection: "column", background: C.bg, color: C.ink, userSelect: "none", overflow: "hidden" }}>
      <GlobalStyles />
      <TopBar zoom={view.k} onAddNode={addNode} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Board nodes={nodes} edges={edges} sel={sel} arm={arm} note={note} results={results}
          live={live} view={view} setView={setView}
          onMoveNode={moveNode} onDisarm={disarm} actions={actions} />
        <EditorRail open={rail} onToggle={setRail} node={selNode} nodes={nodes} edges={edges} sel={sel} onCodeChange={updateCode} />
      </div>
    </div>
  );
}
