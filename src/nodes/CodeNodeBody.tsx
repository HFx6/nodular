import type { PointerEvent as ReactPointerEvent } from "react";
import { C, MONO } from "../theme";
import { CodeMirrorEditor } from "../editor/CodeMirrorEditor";
import type { GraphNode, NodeResult } from "../types";
import type { NodeActions } from "../graph/useGraph";

interface CodeNodeBodyProps {
  node: GraphNode;
  result: NodeResult | undefined;
  actions: NodeActions;
}

/** Code node (js/py): an in-pane CodeMirror editor (always editable, natto-
 *  style) and the result strip below (the implicit `result` port). Export
 *  handles render outside the right edge, from NodeCard. */
export function CodeNodeBody({ node: n, result: res, actions }: CodeNodeBodyProps) {
  // the value strip appears only when there's something to show (a value or an
  // error) — a node with nothing useful shows nothing, natto-style
  const isError = res?.k === "error";
  const showStrip = res?.v != null || isError;
  // fixed node height → editor gets the remainder after header (30), the value
  // strip when present (27) and the body's vertical padding (16), and scrolls
  const editorH = n.h ? Math.max(34, n.h - (showStrip ? 73 : 46)) : undefined;
  return (
    <>
      <div onPointerDown={(e: ReactPointerEvent) => { if (e.button !== 0) return; e.stopPropagation(); actions.onSelect(n.id); }}
        style={{ position: "relative", padding: "8px 10px", fontFamily: MONO, fontSize: 11.5, lineHeight: "17px", color: C.ink,
          cursor: "text" }}>
        <CodeMirrorEditor code={n.code ?? ""} lang={n.lang} variant="pane" height={editorH}
          onChange={(code) => actions.onCodeChange(n.id, code)} />
      </div>
      {showStrip && (
        <div style={{ borderTop: `1px solid ${C.edge}`, padding: "5px 10px", fontFamily: MONO, fontSize: 11,
          color: isError ? C.bad : C.ink, display: "flex", gap: 8, alignItems: "baseline", background: "#fcfcfa", borderRadius: "0 0 4px 4px" }}>
          {isError ? (
            <span style={{ fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res?.why}</span>
          ) : (<>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res?.v}</span>
            <span style={{ fontSize: 9, color: C.faint }}>{res?.k}</span>
          </>)}
        </div>
      )}
    </>
  );
}
