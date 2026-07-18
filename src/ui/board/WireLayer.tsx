import { memo, useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { C } from "../../theme";
import { portPos, wireGeometry } from "../../graph/geometry";
import { routeWire } from "../../graph/routing";
import { preview, resultsStore } from "../../engine/core/resultsStore";
import { portValue } from "../../engine/core/engine";
import type { ArmState, Edge, NodeMap } from "../../types";

/** Live badge for a hovered wire: what's currently crossing it, previewed as
 *  `value · kind` (obj, arr(n), str, fn…), read at render time (hover already
 *  re-renders). "→" edges reuse the node's published result; named-export
 *  edges read their export off the raw value. Before anything has flowed the
 *  badge reads "pending" (or "error" when the source failed). */
function liveSample(e: Edge): string {
  const s = resultsStore.getState();
  const [id, port] = e.from;
  const r =
    port === "→"
      ? s.results[id]
      : id in s.raws
        ? preview(portValue(s.raws[id], port))
        : undefined;
  if (r?.v == null) return s.results[id]?.why ? "error" : "pending";
  return r.k ? `${r.v} · ${r.k}` : r.v;
}

/** True for ~450ms after `dep` changes identity (skipping the initial value).
 *  Rapid changes keep it on — a busy wire reads as continuously live. */
function useFlash(dep: unknown): boolean {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOn(true);
    const t = setTimeout(() => setOn(false), 450);
    return () => clearTimeout(t);
  }, [dep]);
  return on;
}

interface WireProps {
  e: Edge;
  d: string;
  broken: boolean;
  hot: boolean;
  /** another wire holds the 3s hover focus — fade back (#3) */
  dimmed: boolean;
  onHot: (id: string) => void;
  onHotEnd: (id: string) => void;
}

/** One wire: a fat hit path and the visible path. Memoized so a drag
 *  re-routes only the wires whose endpoints moved (#15). Status effects (#5):
 *  a fresh value crossing the wire flashes it green; broken stays red-dashed;
 *  streams keep the drift animation. Labels live in WireLabels, painted above
 *  the nodes (#3). Un-hover is debounced so a thin curve doesn't flicker (#2). */
const Wire = memo(function Wire({
  e,
  d,
  broken,
  hot,
  dimmed,
  onHot,
  onHotEnd,
}: WireProps) {
  // the source's "→" value — identity change means new data crossed this wire
  const value = useStore(resultsStore, (s) => s.values[e.from[0]]);
  const fresh = useFlash(value) && !broken;
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  return (
    <g className={dimmed ? "wire-g dimmed" : "wire-g"}>
      <path
        className="wire-hit"
        d={d}
        stroke="transparent"
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
        onMouseEnter={() => {
          clearTimeout(leaveTimer.current);
          onHot(e.id);
        }}
        onMouseLeave={() => {
          leaveTimer.current = setTimeout(() => onHotEnd(e.id), 100);
        }}
        onClick={(ev) => ev.stopPropagation()}
      />
      <path
        className="wire-path"
        d={d}
        fill="none"
        stroke={broken ? C.bad : fresh ? C.run : hot ? C.wireHot : C.wire}
        strokeWidth={hot ? 1.6 : fresh ? 1.5 : 1.2}
        strokeDasharray={broken ? "3 4" : e.stream ? "1 7" : "none"}
        strokeLinecap="round"
        style={
          e.stream && !broken
            ? { animation: "drift 1.1s linear infinite" }
            : undefined
        }
      />
    </g>
  );
});

interface WireLayerProps {
  nodes: NodeMap;
  edges: Edge[];
  hot: string | null;
  /** edge holding the 3s hover focus; everything else dims (#3) */
  focus: string | null;
  onHot: (id: string) => void;
  onHotEnd: (id: string) => void;
  /** armed source being dragged; renders a pending wire to the cursor */
  arm?: ArmState | null;
}

/** SVG layer drawing all wires. Painted before the node cards; the badges are
 *  in WireLabels so they never hide behind a node. */
export function WireLayer({
  nodes,
  edges,
  hot,
  focus,
  onHot,
  onHotEnd,
  arm,
}: WireLayerProps) {
  // routeWire is pure over its endpoints; cache by rounded coords so a drag that
  // moves one node doesn't re-route every unchanged wire (#15)
  const pathCache = useRef(new Map<string, string>());
  const routeCached = (
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => {
    const key = `${a.x | 0},${a.y | 0},${b.x | 0},${b.y | 0}`;
    let d = pathCache.current.get(key);
    if (d === undefined) {
      d = routeWire(a, b);
      pathCache.current.set(key, d);
    }
    return d;
  };
  if (pathCache.current.size > 4096) pathCache.current.clear();

  const src =
    arm?.drag && nodes[arm.id]
      ? portPos(nodes[arm.id]!, arm.port, "out", edges)
      : null;
  const pendingD =
    src && arm?.drag
      ? `M ${src.x} ${src.y} C ${src.x + Math.max(38, Math.abs(arm.drag.x - src.x) * 0.42)} ${src.y}, ${arm.drag.x - 38} ${arm.drag.y}, ${arm.drag.x} ${arm.drag.y}`
      : null;
  return (
    <svg className="wire-svg" width="1" height="1">
      {pendingD && (
        <path
          d={pendingD}
          fill="none"
          stroke={C.sel}
          strokeWidth={1.4}
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      )}
      {edges.map((e) => {
        const g = wireGeometry(e, nodes, edges);
        if (!g) return null;
        return (
          <Wire
            key={e.id}
            e={e}
            d={routeCached(g.a, g.b)}
            broken={g.broken}
            hot={hot === e.id}
            dimmed={focus !== null && focus !== e.id}
            onHot={onHot}
            onHotEnd={onHotEnd}
          />
        );
      })}
    </svg>
  );
}

/** Wire badges — the hover/broken sample and cross-language pills — rendered
 *  AFTER the node cards so they paint above everything (#3). Same board
 *  transform as WireLayer; fully pointer-transparent. */
export function WireLabels({
  nodes,
  edges,
  hot,
}: {
  nodes: NodeMap;
  edges: Edge[];
  hot: string | null;
}) {
  return (
    <svg className="wire-svg" width="1" height="1">
      {edges.map((e) => {
        const g = wireGeometry(e, nodes, edges);
        if (!g) return null;
        const mx = (g.a.x + g.b.x) / 2,
          my = (g.a.y + g.b.y) / 2;
        if (hot === e.id || g.broken) {
          return (
            <foreignObject
              key={e.id}
              className="wire-fo"
              x={mx - 80}
              y={my - 24}
              width="160"
              height="40"
            >
              <div className="wire-badge-row">
                <span className={`wire-badge${g.broken ? " broken" : ""}`}>
                  {g.broken ? `missing export "${e.from[1]}"` : liveSample(e)}
                </span>
              </div>
            </foreignObject>
          );
        }
        if (e.xlang) {
          return (
            <foreignObject
              key={e.id}
              className="wire-fo"
              x={mx - 24}
              y={my - 9}
              width="48"
              height="18"
            >
              <span className="wire-xlang">{e.xlang}</span>
            </foreignObject>
          );
        }
        return null;
      })}
    </svg>
  );
}
