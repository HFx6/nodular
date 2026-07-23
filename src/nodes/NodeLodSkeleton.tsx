import { memo } from "react";
import { FACE_DIV, FACE_H, paneEditorH, paneRows } from "../editor/metrics";
import type { GraphNode } from "../types";

// A cheap, static minimap-style stand-in for a node body when the board is
// zoomed out far enough that the real content is illegible. Just bars shaped
// like the content, so the card still reads as "a code node" / "a table" from
// across the graph. Absolutely positioned over the (render-skipped) body; never
// affects layout. Only code and table nodes reach here (see NodeCard lodEligible).
//
// The bars come from the SAME paneRows() the height model uses — folded and
// wrapped exactly like the live pane, at the real 19px pitch and mono char
// width — so each bar sits where its rendered line sits. The editor region is
// clipped to its true height and the value footer / face is drawn beneath it,
// so the skeleton has the same silhouette (editor + footer) as the real node.

function CodeSkeleton({ n, on }: { n: GraphNode; on: boolean }) {
  const code = n.code ?? "";
  const editorH = paneEditorH(code, n.lang, n.w);
  const faced = !!n.renderMode && n.renderMode !== "default";
  return (
    <div className={on ? "node-lod on" : "node-lod"}>
      <div className="lod-code" style={{ height: editorH }}>
        {paneRows(code, n.lang, n.w).map((r, i) => (
          <div key={i} className="lod-row">
            {r.w > 0 && (
              <div
                className="lod-line"
                style={{ marginLeft: r.x, width: r.w }}
              />
            )}
          </div>
        ))}
      </div>
      {faced ? (
        <div className="lod-face" style={{ height: FACE_H + FACE_DIV }} />
      ) : (
        <div className="lod-foot" />
      )}
    </div>
  );
}

function TableSkeleton({ on }: { on: boolean }) {
  return (
    <div className={on ? "node-lod lod-table on" : "node-lod lod-table"}>
      <div className="lod-thead" />
      <div className="lod-rows" />
    </div>
  );
}

function NodeLodSkeletonImpl({
  node: n,
  on,
}: {
  node: GraphNode;
  on: boolean;
}) {
  if (n.lang === "ui" && n.kind === "table") return <TableSkeleton on={on} />;
  return <CodeSkeleton n={n} on={on} />;
}

export const NodeLodSkeleton = memo(NodeLodSkeletonImpl);
