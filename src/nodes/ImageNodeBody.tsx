import { useEffect, useState } from "react";
import { C, MONO } from "../theme";
import { useNodeInputs } from "../engine/core/resultsStore";
import type { GraphNode } from "../types";

/** Image built-in: pure sink — renders the `url` input as an <img>. */
export function ImageNodeBody({ node: n }: { node: GraphNode }) {
  const url = useNodeInputs(n.id)?.url;
  const src = typeof url === "string" && url ? url : null;
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  if (!src || broken) {
    return (
      <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 10.5, color: broken ? C.bad : C.faint }}>
        {broken ? "couldn't load image" : "url · waiting for an image url"}
      </div>
    );
  }
  return (
    <img src={src} alt="" draggable={false} onError={() => setBroken(true)}
      style={{ display: "block", width: "100%", borderRadius: "0 0 4px 4px", pointerEvents: "none" }} />
  );
}
