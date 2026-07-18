import type { PointerEvent as ReactPointerEvent } from "react";
import { IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { C } from "../../theme";
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
    <div className="rail-grip" onPointerDown={down} onPointerMove={move}
      onDoubleClick={() => onWidthChange(296)}
      title="drag to resize · double-click to reset" />
  );
}

/** Collapsible side editor: full code editor plus the in-scope bindings for the
 *  selected node. A placeholder for the real CodeMirror 6 panel (ENGINE.md). */
export function EditorRail({ open, onToggle, node: selNode, nodes, edges, sel, width, onWidthChange, onCodeChange }: EditorRailProps) {
  if (!open) {
    return (
      <div className="rail-tab" onClick={() => onToggle(true)}>
        <IconChevronsLeft size={13} stroke={1.5} color={C.dim} />
        <span className="lbl rail-vlbl">editor</span>
      </div>
    );
  }
  const inScope = edges.filter((e) => e.to[0] === sel);
  const isCode = selNode && selNode.lang !== "canvas" && selNode.lang !== "ui";
  if (!selNode) {
    return (
      <div className="rail" style={{ width: `min(${width}px, 70vw)` }}>
        <ResizeHandle onWidthChange={onWidthChange} />
        <div className="rail-head">
          <span className="rail-title empty">editor</span>
          <span className="ctrl frow push" onClick={() => onToggle(false)}><IconChevronsRight size={13} stroke={1.5} /></span>
        </div>
        <div className="rail-none">select a node</div>
      </div>
    );
  }
  return (
    <div className="rail" style={{ width: `min(${width}px, 70vw)` }}>
      <ResizeHandle onWidthChange={onWidthChange} />
      <div className="rail-head">
        <span className="rail-title">{selNode?.name}</span>
        <span className="lbl">{selNode?.lang}</span>
        <span className="push" />
        {isCode && selNode!.lang === "js" && (
          <span className="ctrl lbl" title="format with prettier"
            onClick={() => void formatCode(selNode!.lang, selNode!.code ?? "").then((out) => {
              if (out != null && out !== selNode!.code) onCodeChange(selNode!.id, out);
            })}>fmt</span>
        )}
        <span className="ctrl frow" onClick={() => onToggle(false)}><IconChevronsRight size={13} stroke={1.5} /></span>
      </div>
      {isCode ? (
        <>
          <CodeMirrorEditor key={selNode!.id} code={selNode!.code ?? ""} lang={selNode!.lang} variant="rail"
            onChange={(code) => onCodeChange(selNode!.id, code)} />
          <div className="rail-note hint">
            {selNode!.id === "count" && <>the last expression is this node's value — set n to 200 and watch the screen.</>}
            {selNode!.id === "parts" && <>delete the draw export and the screen loses its renderer; retype it and it's back.</>}
            {selNode!.id === "noise" && <>a module of defs — ƒ field crosses py→js as an async function.</>}
            {!["count", "parts", "noise"].includes(selNode!.id) && <>the last expression is this node's value.</>}
          </div>
        </>
      ) : (
        <div className="rail-doc">
          {selNode?.lang === "canvas"
            ? <>The screen is a pure sink — one input, and its body is the surface. Hover it: the pointer source node reads from it and the walkers follow.</>
            : selNode?.kind === "tick"
              ? <>A clock source — emits at the chosen interval. Its → is a stream.</>
              : <>A source node emitting pointer events from the surface it's pointed at. Sinks sink, sources source.</>}
        </div>
      )}
      <div className="rail-scope">
        <div className="rail-scope-h">in scope</div>
        {inScope.map((e) => (
          <div key={e.id} className="rail-scope-row">
            <span className="rail-scope-name">{e.to[1]}</span>
            <span className="rail-scope-src">← {nodes[e.from[0]]?.name}</span>
          </div>
        ))}
        {inScope.length === 0 && <div className="rail-scope-none">nothing wired in</div>}
      </div>
    </div>
  );
}
