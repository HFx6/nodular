// Pure graph helpers for the flush loop. No engine state, no React.

import type { Edge } from "../../types";

/** Seeds plus everything reachable along from→to edges. */
export function downstreamClosure(seeds: Iterable<string>, edges: Edge[]): Set<string> {
  const out = new Set<string>(seeds);
  const queue = [...out];
  while (queue.length) {
    const id = queue.pop()!;
    for (const e of edges) {
      if (e.from[0] === id && !out.has(e.to[0])) {
        out.add(e.to[0]);
        queue.push(e.to[0]);
      }
    }
  }
  return out;
}

/** Kahn topological order of `work`, considering only edges inside it.
 *  Nodes on a cycle never reach in-degree 0 and come back as `cyclic`. */
export function kahnTopo(work: Set<string>, edges: Edge[]): { order: string[]; cyclic: string[] } {
  const indeg = new Map<string, number>();
  for (const id of work) indeg.set(id, 0);
  const rel = edges.filter((e) => work.has(e.from[0]) && work.has(e.to[0]) && e.from[0] !== e.to[0]);
  for (const e of rel) indeg.set(e.to[0], indeg.get(e.to[0])! + 1);
  const queue = [...work].filter((id) => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const e of rel) {
      if (e.from[0] !== id) continue;
      const d = indeg.get(e.to[0])! - 1;
      indeg.set(e.to[0], d);
      if (d === 0) queue.push(e.to[0]);
    }
  }
  const done = new Set(order);
  return { order, cyclic: [...work].filter((id) => !done.has(id)) };
}
