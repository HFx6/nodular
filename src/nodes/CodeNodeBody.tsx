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
  // fixed node height → editor gets the remainder after header (30), result
  // strip (27) and the body's vertical padding (16), and scrolls internally
  const editorH = n.h ? Math.max(34, n.h - 73) : undefined;
  return (
    <>
      <div onPointerDown={(e: ReactPointerEvent) => { if (e.button !== 0) return; e.stopPropagation(); actions.onSelect(n.id); }}
        style={{ position: "relative", padding: "8px 10px", fontFamily: MONO, fontSize: 11.5, lineHeight: "17px", color: C.ink,
          cursor: "text" }}>
        <CodeMirrorEditor code={n.code ?? ""} lang={n.lang} variant="pane" height={editorH}
          onChange={(code) => actions.onCodeChange(n.id, code)} />
      </div>
      <div style={{ borderTop: `1px solid ${C.edge}`, padding: "5px 10px", fontFamily: MONO, fontSize: 11, minHeight: 26,
        color: res?.v != null ? C.ink : C.faint, display: "flex", gap: 8, alignItems: "baseline", background: "#fcfcfa", borderRadius: "0 0 4px 4px" }}>
        {res?.v != null ? (<>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.v}</span>
          <span style={{ fontSize: 9, color: C.faint }}>{res.k}</span>
        </>) : (
          <span style={{ fontStyle: "italic", fontSize: 10.5 }}>no value — {res?.why ?? "…"}</span>
        )}
      </div>
    </>
  );
}
