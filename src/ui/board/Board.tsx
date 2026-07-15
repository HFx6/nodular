import { useCallback, useEffect, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent, type RefObject, type SetStateAction } from "react";
import { C, GRID, MONO } from "../../theme";
import { NodeCard } from "../../nodes/NodeCard";
import type { NodeActions } from "../../graph/useGraph";
import { useGraphStore } from "../../graph/store";
import { importFile } from "../../persist/file";
import type { ArmState, Edge, LiveState, NodeMap, NodeResult, View } from "../../types";
import { WireLayer } from "./WireLayer";

interface BoardProps {
  boardRef: RefObject<HTMLDivElement | null>;
  nodes: NodeMap;
  edges: Edge[];
  sel: string[];
  arm: ArmState | null;
  note: string | null;
  results: Record<string, NodeResult>;
  live: RefObject<LiveState>;
  view: View;
  setView: Dispatch<SetStateAction<View>>;
  actions: NodeActions;
  notify: (m: string) => void;
}

type DragState =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | { kind: "nodes"; grabs: Array<{ id: string; dx: number; dy: number }>; moved: boolean }
  | { kind: "marquee"; ox: number; oy: number }
  | { kind: "resize"; id: string; ox: number; oy: number; w: number; h: number; widthOnly: boolean };

interface Marquee { x: number; y: number; w: number; h: number }

const MIN_W = 120, MIN_H = 80;

/** The board: a pannable/zoomable canvas holding the wire layer and node cards.
 *  Pointer state machine: background left-drag marquee-selects, middle-drag
 *  pans (anywhere), wheel zooms (trackpad scroll pans, pinch zooms), header
 *  drag moves the selection, armed output + drag draws a pending wire. */
export function Board({ boardRef, nodes, edges, sel, arm, note, results, live, view, setView, actions, notify }: BoardProps) {
  const [hot, setHot] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const drag = useRef<DragState | null>(null);
  // true when the gesture that just ended was a drag (pan/marquee/wire), so the
  // trailing click event must not clear selection or disarm
  const suppressClick = useRef(false);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  // board navigation: mouse wheel and pinch zoom at the cursor, trackpad
  // two-finger scroll pans (natto-style), middle-drag pans (pointer handlers)
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const zoomAt = (e: WheelEvent, factor: number) => {
      setView((v) => {
        const k = Math.min(1.6, Math.max(0.45, v.k * factor));
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
      });
    };
    const onWheel = (e: WheelEvent) => {
      // a resized node's editor scrolls natively — don't hijack its wheel
      const t = e.target instanceof HTMLElement ? e.target.closest(".cm-scroller") : null;
      if (t && t.scrollHeight > t.clientHeight) return;
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

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
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
      moved: false,
    };
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
  };

  const move = (e: ReactPointerEvent) => {
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
      const w = Math.max(MIN_W, Math.round((d.w + p.x - d.ox) / GRID) * GRID);
      const h = Math.max(MIN_H, Math.round((d.h + p.y - d.oy) / GRID) * GRID);
      useGraphStore.getState().resizeNode(d.id, w, d.widthOnly ? undefined : h);
      return;
    }
    const p = toBoard(e);
    d.moved = true;
    useGraphStore.getState().moveNodes(d.grabs.map(({ id, dx, dy }) => ({
      id,
      x: Math.round((p.x - dx) / GRID) * GRID,
      y: Math.round((p.y - dy) / GRID) * GRID,
    })));
  };

  const up = () => {
    const st = useGraphStore.getState();
    // wire drag released over empty space (labels handle their own pointerup)
    if (!drag.current && st.arm?.drag) st.disarm();
    if (drag.current?.kind === "marquee") setMarquee(null);
    drag.current = null;
  };

  const onBackground = (e: { target: EventTarget | null }) => e.target === boardRef.current || e.target === boardRef.current?.firstChild;

  return (
    <div ref={boardRef} onPointerMove={move} onPointerUp={up}
      onPointerDown={(e) => {
        if (e.button === 1) {
          // middle-drag pans from anywhere, including over nodes
          e.preventDefault();
          suppressClick.current = true;
          drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
          return;
        }
        if (e.button === 0 && onBackground(e)) bgDown(e);
      }}
      onClick={(e) => {
        if (onBackground(e) && !suppressClick.current) {
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
      style={{ position: "relative", flex: 1, overflow: "hidden", cursor: arm ? "crosshair" : "default",
        backgroundImage: `radial-gradient(${C.dot} 1px, transparent 1px)`,
        backgroundSize: `${GRID * view.k}px ${GRID * view.k}px`,
        // the gradient dot sits at tile centre; offset half a tile so dots land
        // exactly on grid multiples, where nodes snap
        backgroundPosition: `${view.x - (GRID * view.k) / 2}px ${view.y - (GRID * view.k) / 2}px` }}>

      <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: "0 0" }}>
        <WireLayer nodes={nodes} edges={edges} hot={hot} onHot={setHot} arm={arm} />
        {Object.values(nodes).map((n) => (
          <NodeCard key={n.id} node={n} edges={edges} selected={sel.includes(n.id)} arm={arm}
            result={results[n.id]} live={live} actions={actions}
            onHeaderPointerDown={nodeDown} onResizeStart={resizeStart} registerRef={registerRef} />
        ))}
        {marquee && (
          <div style={{ position: "absolute", left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h,
            border: `1px solid ${C.sel}`, background: C.selSoft, pointerEvents: "none" }} />
        )}
      </div>

      <div style={{ position: "absolute", left: 14, bottom: 10, fontSize: 10.5, color: C.faint, pointerEvents: "none", fontFamily: MONO }}>
        edit count, hover the screen · drag to select, middle-drag to pan, scroll to zoom
      </div>
      {note && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontFamily: MONO, fontSize: 11, background: C.ink, color: "#f2f1ec", padding: "5px 12px", borderRadius: 4, zIndex: 5 }}>{note}</div>
      )}
    </div>
  );
}
