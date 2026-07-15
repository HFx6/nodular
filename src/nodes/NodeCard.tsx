import { memo, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { C, HEAD, MONO, ROW } from "../theme";
import { inputsOf, outsOf } from "../graph/geometry";
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
  onResizeStart: (e: ReactPointerEvent, id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

/** The common node shell: header (controls + value port), input handles on the
 *  left edge, and a family-specific body. Memoized — engine ticks and board
 *  pan/zoom must not re-render node chrome (ENGINE.md). */
function NodeCardImpl({ node: n, edges, selected: seld, arm, result: res, live, actions, onHeaderPointerDown, onResizeStart, registerRef }: NodeCardProps) {
  const isCode = n.lang !== "canvas" && n.lang !== "ui";
  const ins = inputsOf(n, edges);
  const outs = isCode ? outsOf(n) : [];
  return (
    <div ref={(el) => registerRef(n.id, el)}
      onPointerDown={(e) => { if (e.button === 0) e.stopPropagation(); }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, background: C.pane, borderRadius: 4,
        ...(n.h && !n.min ? { height: n.h } : {}),
        border: `1px solid ${seld ? C.sel : C.edge}`, boxShadow: seld ? `0 0 0 3px ${C.selSoft}` : "0 1px 3px rgba(40,40,36,.07)" }}>

      {/* header: × – name lang · mode · run · → */}
      <div onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); onHeaderPointerDown(e, n.id); }}
        style={{ display: "flex", alignItems: "center", gap: 7, height: HEAD, padding: "0 8px 0 10px", background: C.headBg,
          borderBottom: n.min ? "none" : `1px solid ${C.edge}`, borderRadius: n.min ? 4 : "4px 4px 0 0", cursor: "grab" }}>
        <span className="ctrl" onClick={(e) => { e.stopPropagation(); actions.onDelete(n.id); }}>×</span>
        <span className="ctrl" onClick={(e) => { e.stopPropagation(); actions.onToggleMin(n.id); }}>–</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 5, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.name}</span>
          {isCode && <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{n.lang}</span>}
        </span>
        <span style={{ marginLeft: "auto" }} />
        {isCode && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }}>
            <span className="ctrl" style={{ fontSize: 10, width: 52, textAlign: "right", whiteSpace: "nowrap" }}
              onClick={(e) => { e.stopPropagation(); actions.onToggleMode(n.id); }}>{n.manual ? "manual" : "auto"} ▾</span>
            <span className="ctrl" style={{ fontSize: 11, visibility: n.manual ? "visible" : "hidden" }}
              onClick={(e) => { e.stopPropagation(); actions.onRunOnce(n.id); }}>▷</span>
          </span>
        )}
        {n.lang !== "canvas" && (
          <span className="ctrl" title="this node's value"
            onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); actions.onArmOut(n.id, "→"); }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 13, color: res?.v != null || n.lang === "ui" ? C.ink : C.faint }}>→</span>
        )}
      </div>

      {/* inputs on the left edge */}
      {!n.min && ins.map((name, i) => (
        <span key={name} className="ilabel" style={{ top: HEAD + 4 + i * ROW, color: arm ? C.sel : undefined }}
          onPointerUp={() => actions.onDropIn(n.id, name)}
          onClick={(e) => { e.stopPropagation(); actions.onDropIn(n.id, name); }}>{name}</span>
      ))}
      {!n.min && arm && arm.id !== n.id && isCode && (
        <span className="ilabel" style={{ top: HEAD + 4 + ins.length * ROW, color: C.sel, fontStyle: "italic" }}
          onPointerUp={() => actions.onDropIn(n.id, null)}
          onClick={(e) => { e.stopPropagation(); actions.onDropIn(n.id, null); }}>+ {arm.port === "→" ? arm.id : arm.port}</span>
      )}

      {/* inferred export handles, outside the right edge (aligned to wire anchors) */}
      {!n.min && outs.map((o, i) => (
        <span key={o.name} className="olabel" style={{ top: HEAD + 6 + i * ROW }}
          onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); actions.onArmOut(n.id, o.name); }}
          onClick={(e) => e.stopPropagation()}>
          {o.fn ? "ƒ " : ""}{o.name} <span style={{ color: C.faint }}>→</span>
        </span>
      ))}

      {/* family body */}
      {!n.min && (n.lang === "canvas"
        ? <CanvasNodeBody live={live} />
        : n.lang === "ui"
          ? <SourceNodeBody node={n} live={live} />
          : <CodeNodeBody node={n} result={res} actions={actions} />)}

      {/* resize grip */}
      <div
        onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); onResizeStart(e, n.id); }}
        style={{ position: "absolute", right: -2, bottom: -2, width: 12, height: 12, cursor: "nwse-resize",
          opacity: seld ? 1 : 0, transition: "opacity .12s" }}>
        <svg width="12" height="12" style={{ display: "block" }}>
          <path d="M 10 4 L 4 10 M 10 8 L 8 10" stroke={C.faint} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}

export const NodeCard = memo(NodeCardImpl);
