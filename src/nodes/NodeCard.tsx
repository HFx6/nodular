import { memo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { IconAdjustments, IconArrowDownRight, IconChevronDown, IconMinus, IconPlayerPlay, IconX } from "@tabler/icons-react";
import { C, HEAD, MONO, ROW } from "../theme";
import { inputsOf, outsOf } from "../graph/geometry";
import { useNodeResult } from "../engine/core/resultsStore";
import type { ArmState, Edge, GraphNode } from "../types";
import type { NodeActions } from "../graph/useGraph";
import { CodeNodeBody } from "./CodeNodeBody";
import { CanvasNodeBody } from "./CanvasNodeBody";
import { SourceNodeBody } from "./SourceNodeBody";
import { TableNodeBody } from "./TableNodeBody";
import { ImageNodeBody } from "./ImageNodeBody";
import { ImportNodeBody } from "./ImportNodeBody";
import { TextNodeBody } from "./TextNodeBody";
import { StateNodeBody } from "./StateNodeBody";
import { NodeSettings } from "./NodeSettings";

// header icons are tabler at 12px with thin strokes, in currentColor so the
// .ctrl class's dim→ink hover swap applies
const icon = { size: 12, stroke: 1.5, style: { display: "block" } } as const;

interface NodeCardProps {
  node: GraphNode;
  edges: Edge[];
  selected: boolean;
  arm: ArmState | null;
  actions: NodeActions;
  /** an edge holds the hover focus and this node isn't an endpoint (#3) */
  dimmed: boolean;
  onHeaderPointerDown: (e: ReactPointerEvent, id: string) => void;
  /** double-click on a code node's header opens the editor rail (#7) */
  onHeaderDoubleClick: (id: string) => void;
  onResizeStart: (e: ReactPointerEvent, id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

/** The common node shell: header (controls + value port), input handles on the
 *  left edge, and a family-specific body. Memoized — engine ticks and board
 *  pan/zoom must not re-render node chrome (ENGINE.md); the engine's result
 *  arrives through a per-id store subscription, not props. */
function NodeCardImpl({ node: n, edges, selected: seld, arm, actions, dimmed, onHeaderPointerDown, onHeaderDoubleClick, onResizeStart, registerRef }: NodeCardProps) {
  const res = useNodeResult(n.id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // reliable double-click to open the rail: pointer capture during a node drag
  // retargets mouse events to the board, so the native dblclick often never
  // composes — detect a second press within 400ms ourselves, on the whole
  // header (background + title; controls excluded) (#7)
  const lastHeadDown = useRef(0);
  const isCode = n.lang !== "canvas" && n.lang !== "ui";
  const hasSettings = isCode;
  const ins = inputsOf(n, edges);
  const outs = outsOf(n);
  return (
    <div ref={(el) => registerRef(n.id, el)} className="ncard dimmable"
      onPointerDown={(e) => { if (e.button === 0) e.stopPropagation(); }}
      style={{ position: "absolute", left: n.x, top: n.y, width: n.w, background: C.pane, borderRadius: 4,
        ...(n.h && !n.min ? { height: n.h } : {}),
        opacity: dimmed ? 0.25 : 1,
        border: `1px solid ${seld ? C.sel : C.edge}`, boxShadow: seld ? `0 0 0 3px ${C.selSoft}` : "0 1px 3px rgba(40,40,36,.07)" }}>

      {/* header grammar (#5, mockup): × · – · title · settings · mode · run,
          left-clustered, then the → value port alone at the far right — it's a
          port, not a button, so it must stay on the edge for wire anchoring. */}
      <div onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        // second press on the header (not on a control) opens the editor; the
        // press that opens it must not also start a node drag
        const t = e.target instanceof HTMLElement ? e.target : null;
        if (isCode && (!t || !t.closest(".ctrl, .hctl"))) {
          if (e.timeStamp - lastHeadDown.current < 400) { lastHeadDown.current = 0; onHeaderDoubleClick(n.id); return; }
          lastHeadDown.current = e.timeStamp;
        }
        onHeaderPointerDown(e, n.id);
      }}
        style={{ display: "flex", alignItems: "center", gap: 8, height: HEAD, padding: "0 8px 0 10px", background: C.headBg,
          borderBottom: n.min ? "none" : `1px solid ${C.edge}`, borderRadius: n.min ? 4 : "4px 4px 0 0", cursor: "grab" }}>
        <span className="ctrl" title="delete node"
          onClick={(e) => { e.stopPropagation(); actions.onDelete(n.id); }}><IconX {...icon} /></span>
        <span className="ctrl" title="minimize"
          onClick={(e) => { e.stopPropagation(); actions.onToggleMin(n.id); }}><IconMinus {...icon} /></span>
        {/* the title never shrinks or ellipsizes — minNodeWidth clamps resizes
            so the header always has room for every item at full length */}
        <span title={isCode ? "double-click to open the editor" : undefined}
          style={{ display: "flex", alignItems: "baseline", gap: 5, flex: "none" }}>
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{n.name}</span>
          {isCode && <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{n.lang}</span>}
        </span>
        {hasSettings && (
          <span className="ctrl" title="node settings"
            onClick={(e) => { e.stopPropagation(); setSettingsOpen((o) => !o); }}><IconAdjustments {...icon} /></span>
        )}
        {isCode && (
          <span className="hctl" title={n.manual ? "manual — click to run automatically" : "auto — click for manual"}
            onClick={(e) => { e.stopPropagation(); actions.onToggleMode(n.id); }}
            style={{ display: "flex", alignItems: "center", gap: 1, fontFamily: MONO, fontSize: 9.5, color: C.dim, cursor: "pointer", lineHeight: 1.4, whiteSpace: "nowrap" }}>
            {n.manual ? "manual" : "auto"} <IconChevronDown size={9} stroke={1.75} />
          </span>
        )}
        {isCode && (
          <span className="ctrl" title="run now"
            onClick={(e) => { e.stopPropagation(); actions.onRunOnce(n.id); }}><IconPlayerPlay {...icon} /></span>
        )}
        {n.lang !== "canvas" && (
          <span className="ctrl" title="this node's value"
            onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); actions.onArmOut(n.id, "→"); }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 13, marginLeft: "auto", color: res?.v != null || n.lang === "ui" ? C.ink : C.faint }}>→</span>
        )}
      </div>

      {settingsOpen && <NodeSettings node={n} onClose={() => setSettingsOpen(false)} />}

      {/* inputs on the left edge: chipped label for contrast over wires (#4) */}
      {!n.min && ins.map((name, i) => (
        <span key={name} className="ilabel" style={{ top: HEAD + 4 + i * ROW, color: arm ? C.sel : undefined }}
          onPointerUp={() => actions.onDropIn(n.id, name)}
          onClick={(e) => { e.stopPropagation(); actions.onDropIn(n.id, name); }}>
          <span className="portchip">{name}</span>
        </span>
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
          <span className="portchip">{o.fn ? "ƒ " : ""}{o.name}</span> <span style={{ color: C.faint }}>→</span>
        </span>
      ))}

      {/* family body */}
      {!n.min && (n.lang === "canvas"
        ? <CanvasNodeBody node={n} />
        : n.lang === "ui"
          ? (n.kind === "table"
            ? <TableNodeBody node={n} />
            : n.kind === "image"
              ? <ImageNodeBody node={n} />
              : n.kind === "import"
                ? <ImportNodeBody node={n} />
                : n.kind === "text"
                  ? <TextNodeBody node={n} />
                  : n.kind === "state"
                    ? <StateNodeBody node={n} />
                    : <SourceNodeBody node={n} />)
          : <CodeNodeBody node={n} result={res} actions={actions} />)}

      {/* resize grip */}
      <div
        onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); onResizeStart(e, n.id); }}
        style={{ position: "absolute", right: -2, bottom: -2, width: 12, height: 12, cursor: "nwse-resize",
          opacity: seld ? 1 : 0, transition: "opacity .12s" }}>
        <IconArrowDownRight size={12} stroke={1.5} color={C.faint} style={{ display: "block" }} />
      </div>
    </div>
  );
}

export const NodeCard = memo(NodeCardImpl);
