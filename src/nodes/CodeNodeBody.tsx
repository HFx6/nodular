import type { PointerEvent as ReactPointerEvent } from "react";
import { C, MONO } from "../theme";
import { outsOf } from "../graph/geometry";
import { CodeTint } from "../ui/CodeTint";
import type { GraphNode, NodeResult } from "../types";
import type { NodeActions } from "../graph/useGraph";

interface CodeNodeBodyProps {
  node: GraphNode;
  result: NodeResult | undefined;
  actions: NodeActions;
}

/** Code node (js/py): a code peek with live-inferred export handles on the
 *  right, and the result strip below (the implicit `result` port). */
export function CodeNodeBody({ node: n, result: res, actions }: CodeNodeBodyProps) {
  const outs = outsOf(n);
  const stop = (e: ReactPointerEvent) => e.stopPropagation();
  return (
    <>
      <div onPointerDown={n.edit ? (e) => { e.stopPropagation(); actions.onSelect(n.id); } : stop}
        style={{ position: "relative", padding: "8px 10px", fontFamily: MONO, fontSize: 11.5, lineHeight: "17px", color: C.ink,
          paddingRight: outs.length ? 82 : 10, cursor: n.edit ? "text" : "default" }}>
        <CodeTint code={n.code ?? ""} />
        {n.edit && (
          <textarea value={n.code} spellCheck={false} wrap="off"
            onChange={(e) => actions.onCodeChange(n.id, e.target.value)}
            style={{ position: "absolute", inset: 0, padding: "8px 10px", paddingRight: outs.length ? 82 : 10,
              fontFamily: MONO, fontSize: 11.5, lineHeight: "17px", whiteSpace: "pre", overflow: "hidden",
              color: "transparent", caretColor: C.ink, background: "transparent", border: "none", resize: "none", zIndex: 1 }} />
        )}
        <div style={{ position: "absolute", top: 8, right: 0, zIndex: 2 }}>
          {outs.map((o) => (
            <div key={o.name} className="olabel" onClick={(e) => { e.stopPropagation(); actions.onArmOut(n.id, o.name); }}>
              {o.fn ? "ƒ " : ""}{o.name} <span style={{ color: C.faint }}>→</span>
            </div>
          ))}
        </div>
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
