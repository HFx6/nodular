import { memo, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { C, HEAD, MONO, ROW } from "../theme";
import { inputsOf } from "../graph/geometry";
import type { ArmState, Edge, GraphNode, LiveState, NodeResult } from "../types";
import type { NodeActions } from "../graph/useGraph";
import { CodeNodeBody } from "./CodeNodeBody";
import { CanvasNodeBody } from "./CanvasNodeBody";
import { SourceNodeBody } from "./SourceNodeBody";

interface NodeCardProps {
  node: GraphNode;
  edges: Edge[];
  selected: boolean;
  arm: ArmState | null;
  result: NodeResult | undefined;
  live: RefObject<LiveState>;
  actions: NodeActions;
  onHeaderPointerDown: (e: ReactPointerEvent, id: string) => void;
}

/** The common node shell: header (controls + value port), input handles on the
 *  left edge, and a family-specific body. Memoized — engine ticks and board
 *  pan/zoom must not re-render node chrome (ENGINE.md). */
function NodeCardImpl({ node: n, edges, selected: seld, arm, result: res, live, actions, onHeaderPointerDown }: NodeCardProps) {
  const isCode = n.lang !== "canvas" && n.lang !== "ui";
  const ins = inputsOf(n, edges);
  return (
    <div onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, background: C.pane, borderRadius: 4,
        border: `1px solid ${seld ? C.sel : C.edge}`, boxShadow: seld ? `0 0 0 3px ${C.selSoft}` : "0 1px 3px rgba(40,40,36,.07)" }}>

      {/* header: × – name lang · mode · run · → */}
      <div onPointerDown={(e) => { e.stopPropagation(); onHeaderPointerDown(e, n.id); }}
        style={{ display: "flex", alignItems: "center", gap: 7, height: HEAD, padding: "0 8px 0 10px", background: C.headBg,
          borderBottom: n.min ? "none" : `1px solid ${C.edge}`, borderRadius: n.min ? 4 : "4px 4px 0 0", cursor: "grab" }}>
        <span className="ctrl" onClick={(e) => { e.stopPropagation(); actions.onDelete(n.id); }}>×</span>
        <span className="ctrl" onClick={(e) => { e.stopPropagation(); actions.onToggleMin(n.id); }}>–</span>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{n.name}</span>
        {isCode && <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{n.lang}</span>}
        {n.running && <span title="running" style={{ width: 6, height: 6, borderRadius: 3, background: C.run, animation: "blink 1.8s ease-in-out infinite" }} />}
        <span style={{ marginLeft: "auto" }} />
        {isCode && (
          <span className="ctrl" style={{ fontSize: 10 }} onClick={(e) => { e.stopPropagation(); actions.onToggleMode(n.id); }}>{n.manual ? "manual" : "auto"} ▾</span>
        )}
        {n.manual && <span className="ctrl" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); actions.onRunOnce(n.id); }}>▷</span>}
        {n.lang !== "canvas" && (
          <span className="ctrl" title="this node's value" onClick={(e) => { e.stopPropagation(); actions.onArmOut(n.id, "→"); }}
            style={{ fontSize: 13, color: res?.v != null || n.lang === "ui" ? C.ink : C.faint }}>→</span>
        )}
      </div>

      {/* inputs on the left edge */}
      {!n.min && ins.map((name, i) => (
        <span key={name} className="ilabel" style={{ top: HEAD + 4 + i * ROW, color: arm ? C.sel : undefined }}
          onClick={(e) => { e.stopPropagation(); actions.onDropIn(n.id, name); }}>{name}</span>
      ))}
      {!n.min && arm && arm.id !== n.id && isCode && (
        <span className="ilabel" style={{ top: HEAD + 4 + ins.length * ROW, color: C.sel, fontStyle: "italic" }}
          onClick={(e) => { e.stopPropagation(); actions.onDropIn(n.id, null); }}>+ {arm.port === "→" ? arm.id : arm.port}</span>
      )}

      {/* family body */}
      {!n.min && (n.lang === "canvas"
        ? <CanvasNodeBody live={live} />
        : n.lang === "ui"
          ? <SourceNodeBody node={n} live={live} />
          : <CodeNodeBody node={n} result={res} actions={actions} />)}
    </div>
  );
}

export const NodeCard = memo(NodeCardImpl);
