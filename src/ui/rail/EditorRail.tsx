import { C, MONO } from "../../theme";
import type { Edge, GraphNode, NodeMap } from "../../types";

interface EditorRailProps {
  open: boolean;
  onToggle: (open: boolean) => void;
  node: GraphNode | undefined;
  nodes: NodeMap;
  edges: Edge[];
  sel: string;
  onCodeChange: (id: string, code: string) => void;
}

/** Collapsible side editor: full code editor plus the in-scope bindings for the
 *  selected node. A placeholder for the real CodeMirror 6 panel (ENGINE.md). */
export function EditorRail({ open, onToggle, node: selNode, nodes, edges, sel, onCodeChange }: EditorRailProps) {
  if (!open) {
    return (
      <div onClick={() => onToggle(true)}
        style={{ width: 24, borderLeft: `1px solid ${C.edge}`, background: C.pane, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 8 }}>
        <span style={{ fontSize: 11, color: C.dim }}>«</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, writingMode: "vertical-rl" }}>editor</span>
      </div>
    );
  }
  const inScope = edges.filter((e) => e.to[0] === sel);
  const isCode = selNode && selNode.lang !== "canvas" && selNode.lang !== "ui";
  return (
    <div style={{ width: "min(296px, 38vw)", borderLeft: `1px solid ${C.edge}`, background: C.pane, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.edge}` }}>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{selNode?.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{selNode?.lang}</span>
        <span className="ctrl" style={{ marginLeft: "auto", fontSize: 12 }} onClick={() => onToggle(false)}>»</span>
      </div>
      {isCode ? (
        <>
          <textarea value={selNode!.code} spellCheck={false} readOnly={!selNode!.edit}
            onChange={(e) => onCodeChange(selNode!.id, e.target.value)}
            style={{ flex: 1, resize: "none", border: "none", background: "transparent", padding: "10px 12px",
              fontFamily: MONO, fontSize: 12, lineHeight: 1.7, color: selNode!.edit ? C.ink : C.dim }} />
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
