import { useCallback, useEffect, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent, type RefObject, type SetStateAction } from "react";
import { GRID, ZOOM_MAX, ZOOM_MIN } from "../../theme";
import { NodeCard } from "../../nodes/NodeCard";
import type { NodeActions } from "../../graph/useGraph";
import { pauseHistory, resumeHistory, useGraphStore } from "../../graph/store";
import { minNodeWidth } from "../../graph/geometry";
import { dropSize, publishSize } from "../../graph/sizeStore";
import { spawnNode, type SpawnKind } from "../../graph/spawn";
import { importFile } from "../../persist/file";
import type { ArmState, Edge, NodeMap, View } from "../../types";
import { WireLabels, WireLayer } from "./WireLayer";

interface BoardProps {
  boardRef: RefObject<HTMLDivElement | null>;
  nodes: NodeMap;
  edges: Edge[];
  sel: string[];
  arm: ArmState | null;
  note: string | null;
  view: View;
  setView: Dispatch<SetStateAction<View>>;
  actions: NodeActions;
  notify: (m: string) => void;
  /** palette kind waiting to be placed by a click on the canvas (#18) */
  placing: SpawnKind | null;
  onPlace: (p: { x: number; y: number }) => void;
  onCancelPlace: () => void;
  /** double-click on a code node header opens the editor rail (#7) */
  onOpenRail: (id: string) => void;
}

type DragState =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | { kind: "nodes"; grabs: Array<{ id: string; dx: number; dy: number }>; sx: number; sy: number; moved: boolean }
  | { kind: "marquee"; ox: number; oy: number }
  | { kind: "resize"; id: string; ox: number; oy: number; w: number; h: number; widthOnly: boolean };

interface Marquee { x: number; y: number; w: number; h: number }

const MIN_W = 120, MIN_H = 80;
// pointer travel (client px) before a node grab counts as a drag — below this a
// press-and-release is a click, so buttons under the pointer still fire (#12b)
const DRAG_SLOP = 4;

/** The board: a pannable/zoomable canvas holding the wire layer and node cards.
 *  Pointer state machine: background left-drag marquee-selects, middle-drag
 *  pans (anywhere), wheel zooms (trackpad scroll pans, pinch zooms), header
 *  drag moves the selection, armed output + drag draws a pending wire. */
export function Board({ boardRef, nodes, edges, sel, arm, note, view, setView, actions, notify, placing, onPlace, onCancelPlace, onOpenRail }: BoardProps) {
  const [hot, setHot] = useState<string | null>(null);
  // after 3s of hovering one edge, it takes focus: everything else dims and
  // only the two connected nodes stay normal (#3)
  const [focus, setFocus] = useState<string | null>(null);
  // ghost position (board coords, snapped) while placing a new node (#18)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const drag = useRef<DragState | null>(null);
  // true when the gesture that just ended was a drag (marquee/wire/node move), so
  // the trailing click must not clear selection, disarm, or fire a node button
  const suppressClick = useRef(false);
  // node-drag writes are coalesced to one store commit per frame (#15): the
  // latest board point is buffered here and flushed in an animation frame
  const dragRaf = useRef(0);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  // history is paused after the first drag commit (which snapshots the pre-drag
  // doc) so a whole drag — however slow — is one undo entry (#12b)
  const histPaused = useRef(false);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  // Publish each card's rendered size (layout px — unaffected by the view's CSS
  // scale) to sizeStore, so routing and auto-layout have true node boxes. One
  // shared observer; content edits / min-toggles re-fire it automatically.
  const ro = useRef<ResizeObserver | null>(null);
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const en of entries) {
        const el = en.target as HTMLElement;
        const id = el.dataset.nodeId;
        if (id) publishSize(id, el.offsetWidth, el.offsetHeight);
      }
    });
    ro.current = obs;
    // cards whose ref fired before this effect ran (initial mount) aren't yet observed
    for (const el of cardRefs.current.values()) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      el.dataset.nodeId = id;
      cardRefs.current.set(id, el);
      ro.current?.observe(el);
    } else {
      const prev = cardRefs.current.get(id);
      if (prev) ro.current?.unobserve(prev);
      cardRefs.current.delete(id);
      dropSize(id);
    }
  }, []);

  // board navigation: mouse wheel and pinch zoom at the cursor, trackpad
  // two-finger scroll pans (natto-style), middle-drag pans (pointer handlers)
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const zoomAt = (e: WheelEvent, factor: number) => {
      setView((v) => {
        const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.k * factor));
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
      });
    };
    const onWheel = (e: WheelEvent) => {
      // wheel over a code editor scrolls the code, never zooms the board (#2 of
      // the polish pass — supersedes the old focus-only rule)
      const t = e.target instanceof HTMLElement ? e.target.closest(".cm-scroller") : null;
      if (t) return;
      e.preventDefault();
      if (e.ctrlKey) { zoomAt(e, 1 - e.deltaY * 0.01); return; }              // pinch
      const mouseWheel = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 60);
      if (mouseWheel) zoomAt(e, 1 - Math.sign(e.deltaY) * 0.12);              // wheel notch = zoom step
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));  // trackpad scroll = pan
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [boardRef, setView]);

  // Escape cancels an in-flight marquee (arm/selection are handled globally)
  useEffect(() => {
    if (!marquee) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { drag.current = null; setMarquee(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [marquee]);

  // Escape cancels placement mode; the ghost resets with the mode (#18)
  useEffect(() => {
    if (!placing) { setGhost(null); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelPlace(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placing, onCancelPlace]);

  // holding a hover for 3s promotes the hot edge to focus (#3)
  useEffect(() => {
    if (!hot) { setFocus(null); return; }
    const t = setTimeout(() => setFocus(hot), 3000);
    return () => clearTimeout(t);
  }, [hot]);
  const onHot = useCallback((id: string) => setHot(id), []);
  // leave is per-edge so a debounced leave can't clobber a newer hover (#2)
  const onHotEnd = useCallback((id: string) => setHot((h) => (h === id ? null : h)), []);

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  };

  // route all pointer events to the board for the rest of the gesture, so a
  // cursor outrunning the node can't drop moves or change shape (#14). Never
  // used for wire drags — port labels need their own pointerup to connect.
  const capture = (pid: number) => {
    try { boardRef.current?.setPointerCapture(pid); } catch { /* pointer already gone */ }
  };
  /** one cursor for the whole gesture, whatever it passes over (#14) */
  const setDragCursor = (c: "grabbing" | "nwse-resize" | null) => {
    const el = boardRef.current;
    if (!el) return;
    if (c) el.dataset.drag = c; else delete el.dataset.drag;
  };

  /** node rects in board coords, measured from the DOM (heights aren't in the doc) */
  const hitTest = (m: Marquee): string[] => {
    const r = boardRef.current!.getBoundingClientRect();
    const hits: string[] = [];
    for (const [id, el] of cardRefs.current) {
      const b = el.getBoundingClientRect();
      const x = (b.left - r.left - view.x) / view.k, y = (b.top - r.top - view.y) / view.k;
      const w = b.width / view.k, h = b.height / view.k;
      if (x < m.x + m.w && x + w > m.x && y < m.y + m.h && y + h > m.y) hits.push(id);
    }
    return hits;
  };

  const nodeDown = (e: ReactPointerEvent, id: string) => {
    if (e.shiftKey) { useGraphStore.getState().select(id, true); return; }
    const p = toBoard(e);
    const st = useGraphStore.getState();
    const ids = st.sel.includes(id) && st.sel.length > 1 ? st.sel : [id];
    if (ids.length === 1) actions.onSelect(id);
    drag.current = {
      kind: "nodes",
      grabs: ids.filter((i) => nodes[i]).map((i) => ({ id: i, dx: p.x - nodes[i]!.x, dy: p.y - nodes[i]!.y })),
      sx: e.clientX, sy: e.clientY,
      moved: false,
    };
  };

  /** commit the buffered node-drag position to the store (grid-snapped) */
  const commitNodes = (d: Extract<DragState, { kind: "nodes" }>, p: { x: number; y: number }) => {
    useGraphStore.getState().moveNodes(d.grabs.map(({ id, dx, dy }) => ({
      id,
      x: Math.round((p.x - dx) / GRID) * GRID,
      y: Math.round((p.y - dy) / GRID) * GRID,
    })));
  };

  const bgDown = (e: ReactPointerEvent) => {
    suppressClick.current = false;
    const p = toBoard(e);
    drag.current = { kind: "marquee", ox: p.x, oy: p.y };
    setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const resizeStart = (e: ReactPointerEvent, id: string) => {
    const n = nodes[id];
    const el = cardRefs.current.get(id);
    if (!n || !el) return;
    const p = toBoard(e);
    const widthOnly = n.lang === "canvas" || n.lang === "ui" || !!n.min;
    drag.current = { kind: "resize", id, ox: p.x, oy: p.y, w: n.w, h: n.h ?? el.getBoundingClientRect().height / view.k, widthOnly };
    capture(e.pointerId);
    setDragCursor("nwse-resize");
  };

  const move = (e: ReactPointerEvent) => {
    if (placing) {
      const p = toBoard(e);
      setGhost({ x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID });
      return;
    }
    const d = drag.current;
    if (!d) {
      // armed output + held button = wire drag; track the cursor for the pending wire
      if (arm && e.buttons === 1) { suppressClick.current = true; useGraphStore.getState().setArmDrag(toBoard(e)); }
      return;
    }
    if (d.kind === "pan") {
      suppressClick.current = true;
      setView((v) => ({ ...v, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }));
      return;
    }
    if (d.kind === "marquee") {
      const p = toBoard(e);
      const m = { x: Math.min(d.ox, p.x), y: Math.min(d.oy, p.y), w: Math.abs(p.x - d.ox), h: Math.abs(p.y - d.oy) };
      suppressClick.current = true;
      setMarquee(m);
      useGraphStore.getState().setSelection(hitTest(m));
      return;
    }
    if (d.kind === "resize") {
      const p = toBoard(e);
      const n = nodes[d.id];
      // never narrower than the header needs — the title must not truncate
      const minW = Math.max(MIN_W, n ? minNodeWidth(n) : 0);
      const w = Math.max(minW, Math.round((d.w + p.x - d.ox) / GRID) * GRID);
      const h = Math.max(MIN_H, Math.round((d.h + p.y - d.oy) / GRID) * GRID);
      useGraphStore.getState().resizeNode(d.id, w, d.widthOnly ? undefined : h);
      return;
    }
    // dead zone: tiny pointer travel isn't a drag, so a press-and-release on a
    // header button still registers as a click (#12b)
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_SLOP) return;
    if (!d.moved) { capture(e.pointerId); setDragCursor("grabbing"); }
    d.moved = true;
    suppressClick.current = true;
    lastPt.current = toBoard(e);
    if (!dragRaf.current) {
      dragRaf.current = requestAnimationFrame(() => {
        dragRaf.current = 0;
        const dd = drag.current;
        if (dd?.kind === "nodes" && lastPt.current) {
          commitNodes(dd, lastPt.current);
          // first commit recorded the pre-drag snapshot; silence the rest
          if (!histPaused.current) { pauseHistory(); histPaused.current = true; }
        }
      });
    }
  };

  const up = (e: ReactPointerEvent) => {
    const st = useGraphStore.getState();
    // wire drag released over empty space (labels handle their own pointerup)
    if (!drag.current && st.arm?.drag) st.disarm();
    if (drag.current?.kind === "marquee") setMarquee(null);
    if (drag.current?.kind === "nodes") {
      if (dragRaf.current) { cancelAnimationFrame(dragRaf.current); dragRaf.current = 0; }
      // land exactly where released, and don't let the trailing click through
      if (drag.current.moved && lastPt.current) commitNodes(drag.current, lastPt.current);
      if (histPaused.current) { resumeHistory(); histPaused.current = false; }
    }
    // a middle-drag pan fires no click; clear the guard so the next real click works
    if (drag.current?.kind === "pan") suppressClick.current = false;
    drag.current = null;
    lastPt.current = null;
    setDragCursor(null);
    try { if (boardRef.current?.hasPointerCapture(e.pointerId)) boardRef.current.releasePointerCapture(e.pointerId); } catch { /* gone */ }
  };

  const onBackground = (e: { target: EventTarget | null }) => e.target === boardRef.current || e.target === boardRef.current?.firstChild;

  // dot grid with level-of-detail (#3): zooming out from k=1 immediately starts
  // fading the fine layer (every GRID) out and a coarse layer (every 4×GRID,
  // same color — never darker than the normal grid) in, completing by k≈0.65 —
  // the grid re-forms at a legible period instead of aliasing into noise.
  // ZOOM_MIN = ZOOM_MAX/4, so the coarse grid at full zoom-out is exactly the
  // on-screen size of the fine grid at full zoom-in. At k≥1 only the fine
  // layer shows, exactly today's look. Both are just extra entries in the
  // background shorthand — no extra DOM.
  const fineA = Math.min(1, Math.max(0, (view.k - 0.65) / 0.35));
  const fineTile = GRID * view.k, coarseTile = fineTile * 4;
  // both layers are C.dot #d7d7d3 → rgb(215,215,211), crossfaded by alpha
  const gridLayers = {
    backgroundImage: `radial-gradient(rgba(215,215,211,${1 - fineA}) 1px, transparent 1px),
       radial-gradient(rgba(215,215,211,${fineA}) 1px, transparent 1px)`,
    backgroundSize: `${coarseTile}px ${coarseTile}px, ${fineTile}px ${fineTile}px`,
    // the gradient dot sits at tile centre; offset half a tile so dots land
    // exactly on grid multiples, where nodes snap
    backgroundPosition: `${view.x - coarseTile / 2}px ${view.y - coarseTile / 2}px, ${view.x - fineTile / 2}px ${view.y - fineTile / 2}px`,
  };

  const focusEdge = focus ? edges.find((e) => e.id === focus) ?? null : null;
  // placement ghost: the palette kind's default doc shape at the snapped cursor (#18)
  const ghostNode = placing && ghost ? spawnNode("__ghost", ghost, placing) : null;

  return (
    <div ref={boardRef} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onPointerDown={(e) => {
        if (placing) {
          // placement mode: left-click commits at the cursor, right-click cancels (#18)
          if (e.button === 0) onPlace(toBoard(e));
          else onCancelPlace();
          return;
        }
        if (e.button === 1) {
          // middle-drag pans from anywhere, including over nodes
          e.preventDefault();
          suppressClick.current = true;
          drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
          capture(e.pointerId);
          setDragCursor("grabbing");
          return;
        }
        if (e.button === 0 && onBackground(e)) bgDown(e);
      }}
      onContextMenu={(e) => { if (placing) e.preventDefault(); }}
      onClickCapture={(e) => {
        // swallow the click that trails a drag before it reaches any node
        // control (delete/settings/run) or the background handler (#12b)
        if (suppressClick.current) { e.stopPropagation(); suppressClick.current = false; }
      }}
      onClick={(e) => {
        if (onBackground(e)) {
          const st = useGraphStore.getState();
          st.disarm(); st.clearSelection();
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const f = e.dataTransfer?.files?.[0];
        if (!f || !f.name.endsWith(".nodular")) return;
        e.preventDefault();
        void importFile(f).then((ok) => notify(ok ? `imported ${f.name}` : `couldn't read ${f.name}`));
      }}
      className="board"
      style={{ cursor: placing ? "copy" : arm ? "crosshair" : "default", ...gridLayers }}>

      <div className="board-space" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <WireLayer nodes={nodes} edges={edges} hot={hot} focus={focus} onHot={onHot} onHotEnd={onHotEnd} arm={arm} />
        {Object.values(nodes).map((n) => (
          <NodeCard key={n.id} node={n} edges={edges} selected={sel.includes(n.id)} arm={arm} actions={actions}
            dimmed={focusEdge !== null && n.id !== focusEdge.from[0] && n.id !== focusEdge.to[0]}
            onHeaderPointerDown={nodeDown} onHeaderDoubleClick={onOpenRail}
            onResizeStart={resizeStart} registerRef={registerRef} />
        ))}
        {/* wire badges paint above the cards so a node can't hide them (#3) */}
        <WireLabels nodes={nodes} edges={edges} hot={hot} />
        {ghostNode && (
          <div className="ghost" style={{ left: ghostNode.x, top: ghostNode.y, width: ghostNode.w }}>
            <div className="ghost-head">
              {ghostNode.name}
            </div>
            <div className="ghost-body" />
          </div>
        )}
        {marquee && (
          <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
        )}
      </div>

      
      {note && (
        <div className="toast">{note}</div>
      )}
    </div>
  );
}
