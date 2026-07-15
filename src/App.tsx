import { useEffect, useMemo, useRef, useState } from "react";

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
import { clearHistory, useGraphStore } from "./graph/store";
import { INITIAL_EDGES, INITIAL_NODES } from "./graph/initialGraph";
import { clearSaved } from "./persist/autosave";
import { exportFile, importFile } from "./persist/file";
import type { MenuActions } from "./ui/Menu";
import { useLiveRuntime } from "./engine/useLiveRuntime";
import { GlobalStyles } from "./ui/GlobalStyles";
import { TopBar } from "./ui/TopBar";
import { Board } from "./ui/board/Board";
import { useBoardKeys } from "./ui/board/useBoardInput";
import { EditorRail } from "./ui/rail/EditorRail";

export default function App() {
  const { note, say } = useToast();
  const { nodes, edges, sel, primary, arm, actions } = useGraph(say);
  const { live, countRes } = useLiveRuntime(nodes, edges);
  useBoardKeys();

  const [rail, setRail] = useState(false);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const boardRef = useRef<HTMLDivElement>(null);

  // deselect closes the editor rail — nothing selected means nothing to edit.
  // Only on the transition, so the rail can still be opened manually.
  const prevPrimary = useRef(primary);
  useEffect(() => {
    if (prevPrimary.current && !primary) setRail(false);
    prevPrimary.current = primary;
  }, [primary]);

  const loadDemo = () => {
    useGraphStore.getState().setDoc({ nodes: INITIAL_NODES, edges: INITIAL_EDGES });
    clearHistory();
  };
  const menu: MenuActions = {
    onReset: () => { loadDemo(); void clearSaved(); say("canvas reset"); },
    onLoadWalkers: () => { loadDemo(); say("loaded walkers"); },
    onExport: () => exportFile(),
    onImport: (f) => void importFile(f).then((ok) => say(ok ? `imported ${f.name}` : `couldn't read ${f.name}`)),
    onZoomReset: () => setView({ x: 0, y: 0, k: 1 }),
    onToggleRail: () => setRail((r) => !r),
  };

  // new nodes spawn at the viewport centre, in board coordinates
  const addNode = () => {
    const r = boardRef.current?.getBoundingClientRect();
    const at = r
      ? { x: (r.width / 2 - view.x) / view.k - 102, y: (r.height / 2 - view.y) / view.k - 60 }
      : { x: 90, y: 90 };
    useGraphStore.getState().addNode(at);
    say("new node — start typing");
  };

  // inferred node values feeding the result strips
  const results = useMemo<Record<string, NodeResult>>(() => ({
    count: countRes,
    parts: { v: null, why: "module — exports carry the value" },
    noise: { v: null, why: "module of defs" },
  }), [countRes]);

  return (
    <div style={{ fontFamily: SANS, width: "100%", height: "100dvh", minHeight: 480, display: "flex", flexDirection: "column", background: C.bg, color: C.ink, userSelect: "none", overflow: "hidden" }}>
      <GlobalStyles />
      <TopBar zoom={view.k} onAddNode={addNode} menu={menu} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Board boardRef={boardRef} nodes={nodes} edges={edges} sel={sel} arm={arm} note={note} results={results}
          live={live} view={view} setView={setView} actions={actions} notify={say} />
        <EditorRail open={rail} onToggle={setRail} node={nodes[primary]} nodes={nodes} edges={edges} sel={primary}
          onCodeChange={actions.onCodeChange} />
      </div>
    </div>
  );
}
