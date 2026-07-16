import { useEffect, useRef, useState } from "react";

/* nodular — engine v0. Real JS evaluation: js-expr adapter + reactive engine
   core, with table/image/canvas built-ins on the node contract. The demos run
   for real — walkers is ordinary code drawing into the generic canvas sink.

   Composition root only. State/behaviour live in hooks; rendering in ui/ and
   nodes/. See files/PROJECT.md and files/ENGINE.md for the target architecture. */

import { C, SANS } from "./theme";
import type { View } from "./types";
import { useToast } from "./hooks/useToast";
import { useGraph } from "./graph/useGraph";
import { clearHistory, useGraphStore } from "./graph/store";
import { INITIAL_EDGES, INITIAL_NODES } from "./graph/initialGraph";
import { ART_EDGES, ART_NODES } from "./graph/artBrowserGraph";
import { NANOID_EDGES, NANOID_NODES } from "./graph/nanoidGraph";
import { SPAWN_KINDS, type SpawnKind } from "./graph/spawn";
import { clearSaved } from "./persist/autosave";
import { exportFile, importFile } from "./persist/file";
import type { MenuActions } from "./ui/Menu";
import { GlobalStyles } from "./ui/GlobalStyles";
import { TopBar } from "./ui/TopBar";
import { Board } from "./ui/board/Board";
import { useBoardKeys } from "./ui/board/useBoardInput";
import { EditorRail } from "./ui/rail/EditorRail";

export default function App() {
  const { note, say } = useToast();
  const { nodes, edges, sel, primary, arm, actions } = useGraph(say);
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
    onLoadArt: () => {
      useGraphStore.getState().setDoc({ nodes: ART_NODES, edges: ART_EDGES });
      clearHistory();
      say("loaded art browser — click a row");
    },
    onLoadNanoid: () => {
      useGraphStore.getState().setDoc({ nodes: NANOID_NODES, edges: NANOID_EDGES });
      clearHistory();
      say("loaded npm import — a random nanoid");
    },
    onExport: () => exportFile(),
    onImport: (f) => void importFile(f).then((ok) => say(ok ? `imported ${f.name}` : `couldn't read ${f.name}`)),
    onZoomReset: () => setView({ x: 0, y: 0, k: 1 }),
    onToggleRail: () => setRail((r) => !r),
  };

  // new nodes spawn at the viewport centre, in board coordinates
  const centre = () => {
    const r = boardRef.current?.getBoundingClientRect();
    return r
      ? { x: (r.width / 2 - view.x) / view.k - 102, y: (r.height / 2 - view.y) / view.k - 60 }
      : { x: 90, y: 90 };
  };
  const onAdd = (kind: SpawnKind) => {
    useGraphStore.getState().addNode(centre(), kind);
    say(SPAWN_KINDS.find((s) => s.kind === kind)?.toast ?? "new node");
  };

  return (
    <div style={{ fontFamily: SANS, width: "100%", height: "100dvh", minHeight: 480, display: "flex", flexDirection: "column", background: C.bg, color: C.ink, userSelect: "none", overflow: "hidden" }}>
      <GlobalStyles />
      <TopBar zoom={view.k} onAdd={onAdd} menu={menu} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Board boardRef={boardRef} nodes={nodes} edges={edges} sel={sel} arm={arm} note={note}
          view={view} setView={setView} actions={actions} notify={say} />
        <EditorRail open={rail} onToggle={setRail} node={nodes[primary]} nodes={nodes} edges={edges} sel={primary}
          onCodeChange={actions.onCodeChange} />
      </div>
    </div>
  );
}
