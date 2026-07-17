import type { PointerEvent as ReactPointerEvent } from "react";
import { C, MONO } from "../../theme";
import { CodeMirrorEditor } from "../../editor/CodeMirrorEditor";
import { formatCode } from "../../editor/format";
import type { Edge, GraphNode, NodeMap } from "../../types";

interface EditorRailProps {
  open: boolean;
  onToggle: (open: boolean) => void;
  node: GraphNode | undefined;
  nodes: NodeMap;
  edges: Edge[];
  sel: string;
  /** user-resizable width, persisted by the app (#17) */
  width: number;
  onWidthChange: (w: number) => void;
  onCodeChange: (id: string, code: string) => void;
}

const RAIL_MIN = 240;

/** Left-edge drag handle: drag resizes the rail, double-click resets (#17). */
function ResizeHandle({ onWidthChange }: { onWidthChange: (w: number) => void }) {
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const max = Math.round(window.innerWidth * 0.7);
    onWidthChange(Math.min(max, Math.max(RAIL_MIN, Math.round(window.innerWidth - e.clientX))));
  };
  return (
    <div onPointerDown={down} onPointerMove={move} onDoubleClick={() => onWidthChange(296)}
      title="drag to resize · double-click to reset"
      style={{ position: "absolute", left: -3, top: 0, bottom: 0, width: 7, cursor: "col-resize", zIndex: 5 }} />
  );
}

/** Collapsible side editor: full code editor plus the in-scope bindings for the
 *  selected node. A placeholder for the real CodeMirror 6 panel (ENGINE.md). */
export function EditorRail({ open, onToggle, node: selNode, nodes, edges, sel, width, onWidthChange, onCodeChange }: EditorRailProps) {
  if (!open) {
    return (
      <div onClick={() => onToggle(true)}
        style={{ width: 24, borderLeft: `1px solid ${C.edge}`, background: C.pane, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 8 }}>
        <span style={{ fontSize: 11, color: C.dim }}>«</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, writingMode: "vertical-rl" }}>editor</span>
      </div>
    );
  }
  const railStyle = {
    position: "relative", width: `min(${width}px, 70vw)`, borderLeft: `1px solid ${C.edge}`,
    background: C.pane, display: "flex", flexDirection: "column", minHeight: 0,
  } as const;
  const inScope = edges.filter((e) => e.to[0] === sel);
  const isCode = selNode && selNode.lang !== "canvas" && selNode.lang !== "ui";
  if (!selNode) {
    return (
      <div className="rail" style={railStyle}>
        <ResizeHandle onWidthChange={onWidthChange} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.edge}` }}>
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.faint }}>editor</span>
          <span className="ctrl" style={{ marginLeft: "auto", fontSize: 12 }} onClick={() => onToggle(false)}>»</span>
        </div>
        <div style={{ padding: 12, fontSize: 11.5, color: C.faint, fontStyle: "italic" }}>select a node</div>
      </div>
    );
  }
  return (
    <div className="rail" style={railStyle}>
      <ResizeHandle onWidthChange={onWidthChange} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.edge}` }}>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{selNode?.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{selNode?.lang}</span>
        <span style={{ marginLeft: "auto" }} />
        {isCode && selNode!.lang === "js" && (
          <span className="ctrl" title="format with prettier" style={{ fontFamily: MONO, fontSize: 10 }}
            onClick={() => void formatCode(selNode!.lang, selNode!.code ?? "").then((out) => {
              if (out != null && out !== selNode!.code) onCodeChange(selNode!.id, out);
            })}>fmt</span>
        )}
        <span className="ctrl" style={{ fontSize: 12 }} onClick={() => onToggle(false)}>»</span>
      </div>
      {isCode ? (
        <>
          <CodeMirrorEditor key={selNode!.id} code={selNode!.code ?? ""} lang={selNode!.lang} variant="rail"
            onChange={(code) => onCodeChange(selNode!.id, code)} />
          <div style={{ borderTop: `1px dashed ${C.edge}`, padding: "7px 12px", fontSize: 10.5, color: C.dim, lineHeight: 1.6 }}>
            {selNode!.id === "count" && <>the last expression is this node's value — set n to 200 and watch the screen.</>}
            {selNode!.id === "parts" && <>delete the draw export and the screen loses its renderer; retype it and it's back.</>}
            {selNode!.id === "noise" && <>a module of defs — ƒ field crosses py→js as an async function.</>}
            {!["count", "parts", "noise"].includes(selNode!.id) && <>the last expression is this node's value.</>}
          </div>
        </>
      ) : (
        <div style={{ padding: 12, fontSize: 12, color: C.dim, lineHeight: 1.65 }}>
          {selNode?.lang === "canvas"
            ? <>The screen is a pure sink — one input, and its body is the surface. Hover it: the pointer source node reads from it and the walkers follow.</>
            : selNode?.kind === "tick"
              ? <>A clock source — emits at the chosen interval. Its → is a stream.</>
              : <>A source node emitting pointer events from the surface it's pointed at. Sinks sink, sources source.</>}
        </div>
      )}
      <div style={{ borderTop: `1px solid ${C.edge}`, padding: "9px 12px" }}>
        <div style={{ fontSize: 10, color: C.faint, marginBottom: 5 }}>in scope</div>
        {inScope.map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 7, alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>{e.to[1]}</span>
            <span style={{ fontSize: 10, color: C.faint }}>← {nodes[e.from[0]]?.name}</span>
          </div>
        ))}
        {inScope.length === 0 && <div style={{ fontSize: 10.5, color: C.faint, fontStyle: "italic" }}>nothing wired in</div>}
      </div>
    </div>
  );
}
