import { useEffect, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent, type RefObject, type SetStateAction } from "react";
import { C, GRID, MONO } from "../../theme";
import { NodeCard } from "../../nodes/NodeCard";
import type { NodeActions } from "../../graph/useGraph";
import type { ArmState, Edge, LiveState, NodeMap, NodeResult, View } from "../../types";
import { WireLayer } from "./WireLayer";

interface BoardProps {
  nodes: NodeMap;
  edges: Edge[];
  sel: string;
  arm: ArmState | null;
  note: string | null;
  results: Record<string, NodeResult>;
  live: RefObject<LiveState>;
  view: View;
  setView: Dispatch<SetStateAction<View>>;
  onMoveNode: (id: string, x: number, y: number) => void;
  onDisarm: () => void;
  actions: NodeActions;
}

type DragState =
  | { pan: true; sx: number; sy: number; vx: number; vy: number }
  | { pan?: false; id: string; dx: number; dy: number };

/** The board: a pannable/zoomable canvas holding the wire layer and node cards. */
export function Board({ nodes, edges, sel, arm, note, results, live, view, setView, onMoveNode, onDisarm, actions }: BoardProps) {
  const [hot, setHot] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const board = useRef<HTMLDivElement>(null);

  // board navigation: drag background pans, wheel pans, ctrl/pinch zooms
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        setView((v) => {
          const k = Math.min(1.6, Math.max(0.45, v.k * (1 - e.deltaY * 0.01)));
          const r = el.getBoundingClientRect();
          const mx = e.clientX - r.left, my = e.clientY - r.top;
          return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
        });
      } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setView]);

  const toBoard = (e: ReactPointerEvent) => {
    const r = board.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  };
  const nodeDown = (e: ReactPointerEvent, id: string) => {
    const p = toBoard(e);
    drag.current = { id, dx: p.x - nodes[id]!.x, dy: p.y - nodes[id]!.y };
    actions.onSelect(id);
  };
  const bgDown = (e: ReactPointerEvent) => { drag.current = { pan: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; };
  const move = (e: ReactPointerEvent) => {
    const d = drag.current; if (!d) return;
    if (d.pan) { setView((v) => ({ ...v, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy })); return; }
    const p = toBoard(e);
    const x = Math.max(6, Math.round((p.x - d.dx) / GRID) * GRID);
    const y = Math.max(6, Math.round((p.y - d.dy) / GRID) * GRID);
    onMoveNode(d.id, x, y);
  };
  const onBackground = (e: { target: EventTarget | null }) => e.target === board.current || e.target === board.current?.firstChild;

  return (
    <div ref={board} onPointerMove={move} onPointerUp={() => (drag.current = null)}
      onPointerDown={(e) => { if (onBackground(e)) bgDown(e); }}
      onClick={(e) => { if (onBackground(e)) onDisarm(); }}
      style={{ position: "relative", flex: 1, overflow: "hidden", cursor: arm ? "crosshair" : "default",
        backgroundImage: `radial-gradient(${C.dot} 1px, transparent 1px)`,
        backgroundSize: `${GRID * view.k}px ${GRID * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px` }}>

      <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: "0 0" }}>
        <WireLayer nodes={nodes} edges={edges} hot={hot} onHot={setHot} />
        {Object.values(nodes).map((n) => (
          <NodeCard key={n.id} node={n} edges={edges} selected={sel === n.id} arm={arm}
            result={results[n.id]} live={live} actions={actions} onHeaderPointerDown={nodeDown} />
        ))}
      </div>

      <div style={{ position: "absolute", left: 14, bottom: 10, fontSize: 10.5, color: C.faint, pointerEvents: "none", fontFamily: MONO }}>
        edit count, hover the screen · drag background to pan, pinch/ctrl-wheel to zoom · × – auto▾ all live
      </div>
      {note && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontFamily: MONO, fontSize: 11, background: C.ink, color: "#f2f1ec", padding: "5px 12px", borderRadius: 4, zIndex: 5 }}>{note}</div>
      )}
    </div>
  );
}
