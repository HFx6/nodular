import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";
import { HEAD } from "../theme";
import { CodeMirrorEditor } from "../editor/CodeMirrorEditor";
import { useNodeValue } from "../engine/core/resultsStore";
import { useGraphStore } from "../graph/store";
import { sizeStore } from "../graph/sizeStore";
import type { GraphNode, NodeResult } from "../types";
import type { NodeActions } from "../graph/useGraph";
import { ValueFace } from "./ValueFace";

interface CodeNodeBodyProps {
  node: GraphNode;
  result: NodeResult | undefined;
  actions: NodeActions;
}

/** divider hit area (px) — the visible line is 1px, centred */
const DIVIDER = 7;
/** editor region vertical padding (10px top + bottom) */
const PAD_V = 20;
/** dragging the divider within this fraction of an edge snaps the region shut */
const SNAP = 0.08;

/** Code node (js/py), natto-style (#2): CodeMirror editor on top, the node's
 *  value below.
 *  - default render mode: the value is a FOOTER — auto height, hugging its
 *    one-line preview (or the full error, wrapped, in red); the editor gets
 *    everything else. No divider — there's nothing to apportion.
 *  - a value face (table/text/html): a real vertical split — the face is a
 *    first-class region and a draggable divider sets the share (stored per
 *    node as `split`); dragging to an extreme collapses a region to a slim
 *    bar (split 0 = a value-only pane, natto's hidden-code mode).
 *  Fixed-height nodes fill their box; auto-height nodes grow with content and
 *  freeze at their measured height on the first divider drag. */
export function CodeNodeBody({
  node: n,
  result: res,
  actions,
}: CodeNodeBodyProps) {
  const rawValue = useNodeValue(n.id);
  const isError = res?.k === "error";
  const face =
    !isError && n.renderMode && n.renderMode !== "default"
      ? n.renderMode
      : undefined;
  const showFooter = !face && (res?.v != null || isError);

  const split = Math.min(1, Math.max(0, n.split ?? 0.5));
  // fixed node height → the body fills it; the -1 absorbs the header's border
  const total = n.h ? n.h - HEAD - 1 : undefined;
  const editorRegionH =
    face && total !== undefined
      ? Math.round((total - DIVIDER) * split)
      : undefined;
  const valueRegionH =
    face && total !== undefined ? total - DIVIDER - editorRegionH! : undefined;

  const colRef = useRef<HTMLDivElement>(null);

  const dividerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    // an auto-height node freezes at its measured height on first divider drag
    if (!n.h) {
      const h = sizeStore.getState().sizes[n.id]?.h;
      if (!h) return;
      useGraphStore.getState().resizeNode(n.id, n.w, Math.round(h));
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const dividerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.stopPropagation();
    const col = colRef.current;
    if (!col) return;
    // client-px ratio — the board's CSS scale cancels out
    const r = col.getBoundingClientRect();
    if (!r.height) return;
    let f = (e.clientY - r.top) / r.height;
    if (f < SNAP) f = 0;
    else if (f > 1 - SNAP) f = 1;
    useGraphStore.getState().setSplit(n.id, Math.min(1, Math.max(0, f)));
  };

  return (
    <div
      ref={colRef}
      className="code-col"
      style={total !== undefined ? { height: total } : undefined}
    >
      {/* editor region — with a face it collapses to its padding bar at split 0;
          without one it takes whatever the footer doesn't need */}
      <div
        className="code-edit"
        onPointerDown={(e: ReactPointerEvent) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          actions.onSelect(n.id);
        }}
        style={
          editorRegionH !== undefined
            ? { height: editorRegionH, flex: "none" }
            : total !== undefined
              ? { flex: 1, minHeight: 0 }
              : undefined
        }
      >
        <CodeMirrorEditor
          code={n.code ?? ""}
          lang={n.lang}
          variant="pane"
          height={
            editorRegionH !== undefined
              ? Math.max(0, editorRegionH - PAD_V)
              : total !== undefined
                ? "fill"
                : undefined
          }
          onChange={(code) => actions.onCodeChange(n.id, code)}
        />
      </div>

      {face && (
        <>
          <div
            className="code-div"
            onPointerDown={dividerDown}
            onPointerMove={dividerMove}
            onPointerUp={(e: ReactPointerEvent) => e.stopPropagation()}
            title="drag to resize the value area"
          >
            <div className="code-divline" />
          </div>
          {/* value face — a first-class region; collapses at split 1 */}
          <div
            className="code-face"
            style={
              valueRegionH !== undefined
                ? { height: valueRegionH, flex: "none" }
                : { maxHeight: 216 }
            }
          >
            <ValueFace
              value={rawValue}
              mode={face}
              maxHeight={valueRegionH ?? 216}
            />
          </div>
        </>
      )}

      {showFooter && (
        <div className="code-foot">
          {isError ? (
            <div
              className="code-err"
              onPointerDown={(e: ReactPointerEvent) => e.stopPropagation()}
            >
              {res?.why}
            </div>
          ) : (
            <div
              className="code-prev"
              onPointerDown={(e: ReactPointerEvent) => e.stopPropagation()}
            >
              <span className="code-prev-v">{res?.v}</span>
              <span className="kindchip">{res?.k}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
