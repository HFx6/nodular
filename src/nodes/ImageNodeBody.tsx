import { useEffect, useState } from "react";
import { useNodeInputs } from "../engine/core/resultsStore";
import type { GraphNode } from "../types";
import { Waiting } from "./Waiting";

/** Image built-in: pure sink — renders the `url` input as an <img>. */
export function ImageNodeBody({ node: n }: { node: GraphNode }) {
  const inputs = useNodeInputs(n.id);
  const url = inputs?.url;
  const src = typeof url === "string" && url ? url : null;
  const [broken, setBroken] = useState(false);
  // the network fetch is the slow part, so the spinner has to outlast the url
  // arriving and cover the load itself (#9)
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setBroken(false);
    setLoaded(false);
  }, [src]);

  if (!src || broken) {
    const wired = !!inputs && "url" in inputs;
    return (
      <Waiting
        bad={broken}
        busy={!broken && wired}
        msg={
          broken
            ? "couldn't load image"
            : wired
              ? "url · waiting for a url"
              : "url · waiting for an image url"
        }
      />
    );
  }
  return (
    <>
      {!loaded && <Waiting busy msg="url · loading" />}
      <img
        className="img-fit"
        // kept mounted while hidden so the browser actually runs the load
        style={loaded ? undefined : { display: "none" }}
        src={src}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setBroken(true)}
      />
    </>
  );
}
