import { useEffect, useRef, useState } from "react";

/* nodular — engine v0. Real JS evaluation: js-expr adapter + reactive engine
   core, with table/image/canvas built-ins on the node contract. The demos run
   for real — walkers is ordinary code drawing into the generic canvas sink.

   Composition root only. State/behaviour live in hooks; rendering in ui/ and
   nodes/. See files/PROJECT.md and files/ENGINE.md for the target architecture. */

import { ZOOM_MAX, ZOOM_MIN } from "./theme";
import type { View } from "./types";
import { useToast } from "./hooks/useToast";
import { useGraph } from "./graph/useGraph";
import { clearHistory, SEED_DOC, useGraphStore } from "./graph/store";
import { nodeRect } from "./graph/geometry";
import { sizeStore, whenMeasured } from "./graph/sizeStore";
import type { GraphDoc } from "./graph/store";
import { SPAWN_KINDS, type SpawnKind } from "./graph/spawn";
import { clearSaved } from "./persist/autosave";
import { exportFile, importFile } from "./persist/file";
import { formatDoc } from "./editor/format";
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
  // rail width is user-resizable and remembered across sessions (#17)
  const [railW, setRailW] = useState(() => {
    const w = Number(localStorage.getItem("nodular.railW"));
    return Number.isFinite(w) && w >= 240 ? w : 296;
  });
  useEffect(() => {
    localStorage.setItem("nodular.railW", String(railW));
  }, [railW]);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  // palette kind waiting for a placement click on the canvas (#18)
  const [placing, setPlacing] = useState<SpawnKind | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // eased view changes for fitView / zoom reset (#16) — a ~250ms rAF tween,
  // skipped entirely under prefers-reduced-motion
  const viewNow = useRef(view);
  useEffect(() => {
    viewNow.current = view;
  }, [view]);
  const viewAnim = useRef(0);
  const tweenView = (target: View) => {
    cancelAnimationFrame(viewAnim.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(target);
      return;
    }
    const from = viewNow.current;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 250);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setView({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        k: from.k + (target.k - from.k) * e,
      });
      if (t < 1) viewAnim.current = requestAnimationFrame(step);
    };
    viewAnim.current = requestAnimationFrame(step);
  };

  // deselect closes the editor rail — nothing selected means nothing to edit.
  // Only on the transition, so the rail can still be opened manually.
  const prevPrimary = useRef(primary);
  useEffect(() => {
    if (prevPrimary.current && !primary) setRail(false);
    prevPrimary.current = primary;
  }, [primary]);

  // frame all nodes in the viewport (used after auto-layout)
  const fitView = () => {
    const r = boardRef.current?.getBoundingClientRect();
    const st = useGraphStore.getState();
    const ns = Object.values(st.nodes);
    if (!r || !ns.length) return;
    const sizes = sizeStore.getState().sizes;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of ns) {
      const rc = nodeRect(n, sizes, st.edges);
      minX = Math.min(minX, rc.x);
      minY = Math.min(minY, rc.y);
      maxX = Math.max(maxX, rc.x + rc.w);
      maxY = Math.max(maxY, rc.y + rc.h);
    }
    const pad = 60;
    const k = Math.min(
      ZOOM_MAX,
      Math.max(
        ZOOM_MIN,
        Math.min(
          r.width / (maxX - minX + pad * 2),
          r.height / (maxY - minY + pad * 2),
        ),
      ),
    );
    tweenView({
      k,
      x: r.width / 2 - ((minX + maxX) / 2) * k,
      y: r.height / 2 - ((minY + maxY) / 2) * k,
    });
  };

  // frame the graph on first mount — the saved doc hydrates before render, but
  // card heights are content-driven and only exist once the cards have measured
  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    didInitialFit.current = true;
    void whenMeasured(Object.keys(useGraphStore.getState().nodes)).then(
      fitView,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // opening the rail narrows the board — pan so the edited node lands in the
  // centre of the board area that will remain visible (#6)
  const centerNode = (id: string) => {
    const r = boardRef.current?.getBoundingClientRect();
    const st = useGraphStore.getState();
    const n = st.nodes[id];
    if (!r || !n) return;
    const railOpenW = Math.min(railW, Math.round(window.innerWidth * 0.7));
    const nextW = r.width + (rail ? railOpenW : 24) - railOpenW;
    const rc = nodeRect(n, sizeStore.getState().sizes, st.edges);
    const k = viewNow.current.k;
    tweenView({
      k,
      x: nextW / 2 - (rc.x + rc.w / 2) * k,
      y: r.height / 2 - (rc.y + rc.h / 2) * k,
    });
  };

  // load a doc: prettify its js first, auto-arrange with estimated heights so
  // it frames sanely at once, then — heights are content-driven and only exist
  // after render — re-run the layout against measured sizes and make THAT the
  // clean history baseline
  const loadDoc = async (doc: GraphDoc) => {
    const formatted = await formatDoc(doc);
    const st = useGraphStore.getState();
    st.setDoc(formatted);
    st.tidy();
    fitView();
    await whenMeasured(Object.keys(formatted.nodes));
    useGraphStore.getState().tidy();
    clearHistory();
    fitView();
  };
  const tidy = () => {
    useGraphStore.getState().tidy();
    fitView();
    say("tidied layout");
  };
  const menu: MenuActions = {
    onReset: () => {
      void loadDoc(SEED_DOC);
      void clearSaved();
      say("canvas reset");
    },
    onLoadExample: (ex) =>
      void ex
        .load()
        .then((doc) => loadDoc(doc))
        .then(() => say(ex.toast))
        .catch(() => say(`couldn't load ${ex.name}`)),
    onTidy: tidy,
    onExport: () => exportFile(),
    onImport: (f) =>
      void importFile(f).then((ok) =>
        say(ok ? `imported ${f.name}` : `couldn't read ${f.name}`),
      ),
    onZoomReset: () => tweenView({ x: 0, y: 0, k: 1 }),
    onToggleRail: () => setRail((r) => !r),
  };

  // picking a palette kind arms placement mode; the node is created where the
  // user clicks the canvas (esc / right-click cancels) (#18)
  const onAdd = (kind: SpawnKind) => {
    setPlacing(kind);
    say("click the canvas to place — esc cancels");
  };
  const onPlace = (p: { x: number; y: number }) => {
    if (!placing) return;
    useGraphStore.getState().addNode(p, placing);
    setPlacing(null);
    say(SPAWN_KINDS.find((s) => s.kind === placing)?.toast ?? "new node");
  };

  return (
    <div className="app">
      <GlobalStyles />
      <TopBar zoom={view.k} onAdd={onAdd} onCenter={fitView} menu={menu} />
      <div className="app-main">
        <Board
          boardRef={boardRef}
          nodes={nodes}
          edges={edges}
          sel={sel}
          arm={arm}
          note={note}
          view={view}
          setView={setView}
          actions={actions}
          notify={say}
          placing={placing}
          onPlace={onPlace}
          onCancelPlace={() => setPlacing(null)}
          onOpenRail={(id) => {
            actions.onSelect(id);
            setRail(true);
            centerNode(id);
          }}
        />
        <EditorRail
          open={rail}
          onToggle={setRail}
          node={nodes[primary]}
          nodes={nodes}
          edges={edges}
          sel={primary}
          width={railW}
          onWidthChange={setRailW}
          onCodeChange={actions.onCodeChange}
        />
      </div>
    </div>
  );
}
