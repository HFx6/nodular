import { useEffect, useState } from "react";
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
      <div className={`bihint${broken ? " bad" : ""}`}>
        {broken ? "couldn't load image" : "url · waiting for an image url"}
      </div>
    );
  }
  return (
    <img className="img-fit" src={src} alt="" draggable={false} onError={() => setBroken(true)} />
  );
}
