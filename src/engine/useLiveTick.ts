import { useEffect, useState, type RefObject } from "react";
import type { LiveState } from "../types";

/** Samples the live tick counter on an interval, so only the source nodes that
 *  display it re-render — not the whole board. (rAF-sampled inspectors, not
 *  per-emit re-renders; ENGINE.md.) */
export function useLiveTick(live: RefObject<LiveState>, ms = 500) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), ms);
    return () => clearInterval(i);
  }, [live, ms]);
  return live.current.t;
}
