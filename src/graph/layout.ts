// Auto-layout: a layered (Sugiyama-style) left-to-right DAG placement, like the
// dagre-based examples in react-flow. Flow runs left→right because ports sit on
// node sides (inputs left, outputs right). Pure — takes the doc + measured sizes
// and returns new positions; the caller applies them.
//
// Pipeline: break cycles → rank by longest path → order within layers to reduce
// crossings (median sweeps) → assign coordinates (columns by width, centered
// stacks by height) → snap to grid.

import { GRID } from "../theme";
import { estimateHeight, inputsOf, outsOf } from "./geometry";
import type { SizeMap } from "./sizeStore";
import type { Edge, GraphNode, NodeMap } from "../types";

export interface LayoutOpts {
  /** clear wire channel between a column's output labels and the next column's inputs */
  channel?: number;
  gapY?: number;
  origin?: { x: number; y: number };
  sweeps?: number;
}

// port labels (.olabel/.ilabel) render in the gap between columns at 11px mono;
// size gaps to fit them so they never overlap. ~6.6px per char + padding.
const CHAR = 6.6;
function outLabelWidth(n: GraphNode): number {
  if (n.min) return 0;
  return Math.max(
    0,
    ...outsOf(n).map(
      (o) => 7 + ((o.fn ? 2 : 0) + o.name.length + 2) * CHAR + 6,
    ),
  );
}
function inLabelWidth(n: GraphNode, edges: Edge[]): number {
  if (n.min) return 0;
  return Math.max(
    0,
    ...inputsOf(n, edges).map((name) => 7 + name.length * CHAR),
  );
}

export function layeredLayout(
  nodes: NodeMap,
  edges: Edge[],
  sizes: SizeMap,
  opts: LayoutOpts = {},
): Record<string, { x: number; y: number }> {
  const channel = opts.channel ?? GRID * 4;
  const gapY = opts.gapY ?? GRID * 2;
  const origin = opts.origin ?? { x: GRID * 3, y: GRID * 3 };
  const sweeps = opts.sweeps ?? 4;

  const ids = Object.keys(nodes);
  const pos: Record<string, { x: number; y: number }> = {};
  if (ids.length === 0) return pos;

  const height = (id: string) =>
    sizes[id]?.h ?? nodes[id]!.h ?? estimateHeight(nodes[id]!, edges);
  const width = (id: string) => nodes[id]!.w;

  // directed edges (deduped, no self-loops), plus undirected adjacency for ordering
  const dir = new Map<string, Set<string>>(
    ids.map((id) => [id, new Set<string>()]),
  );
  const undirected = new Map<string, Set<string>>(
    ids.map((id) => [id, new Set<string>()]),
  );
  for (const e of edges) {
    const u = e.from[0],
      v = e.to[0];
    if (u === v || !nodes[u] || !nodes[v]) continue;
    dir.get(u)!.add(v);
    undirected.get(u)!.add(v);
    undirected.get(v)!.add(u);
  }

  // break cycles: DFS, drop edges pointing back to a node on the current stack
  const forward = new Map<string, Set<string>>(
    ids.map((id) => [id, new Set<string>()]),
  );
  const state = new Map<string, 0 | 1 | 2>(ids.map((id) => [id, 0])); // 0 white 1 gray 2 black
  const dfs = (u: string) => {
    state.set(u, 1);
    for (const v of dir.get(u)!) {
      if (state.get(v) === 1) continue; // back edge — skip for ranking
      forward.get(u)!.add(v);
      if (state.get(v) === 0) dfs(v);
    }
    state.set(u, 2);
  };
  for (const id of ids) if (state.get(id) === 0) dfs(id);

  // longest-path ranks over the DAG of forward edges (Kahn topological order)
  const indeg = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const u of ids)
    for (const v of forward.get(u)!) indeg.set(v, indeg.get(v)! + 1);
  const rank = new Map<string, number>(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const topo: string[] = [];
  const deg = new Map(indeg);
  while (queue.length) {
    const u = queue.shift()!;
    topo.push(u);
    for (const v of forward.get(u)!) {
      rank.set(v, Math.max(rank.get(v)!, rank.get(u)! + 1));
      deg.set(v, deg.get(v)! - 1);
      if (deg.get(v) === 0) queue.push(v);
    }
  }

  // degree-0 nodes (no wires at all) go to a trailing column so they don't
  // clutter the source layer
  const maxRank = Math.max(0, ...ids.map((id) => rank.get(id)!));
  const isolatedLayer = maxRank + 1;
  const layerOf = (id: string) =>
    undirected.get(id)!.size === 0 ? isolatedLayer : rank.get(id)!;

  // group into layers in topo (then id) order for a stable initial ordering
  const seen = new Set(topo);
  const initialOrder = [...topo, ...ids.filter((id) => !seen.has(id))];
  const layers: string[][] = [];
  for (const id of initialOrder) {
    const l = layerOf(id);
    (layers[l] ??= []).push(id);
  }
  for (let l = 0; l < layers.length; l++) layers[l] ??= [];

  // crossing reduction: median sweeps against the previously-ordered layer
  const orderIndex = () => {
    const idx = new Map<string, number>();
    for (const layer of layers) layer.forEach((id, i) => idx.set(id, i));
    return idx;
  };
  for (let s = 0; s < sweeps; s++) {
    const down = s % 2 === 0;
    const idx = orderIndex();
    const range = down ? [...layers.keys()] : [...layers.keys()].reverse();
    for (const l of range) {
      const ref = down ? l - 1 : l + 1;
      if (ref < 0 || ref >= layers.length) continue;
      const refSet = new Set(layers[ref]!);
      const bary = (id: string) => {
        const ns = [...undirected.get(id)!].filter((n) => refSet.has(n));
        if (ns.length === 0) return Infinity; // keep floating nodes in place
        const vals = ns.map((n) => idx.get(n)!).sort((a, b) => a - b);
        const m = vals.length;
        return m % 2
          ? vals[(m - 1) / 2]!
          : (vals[m / 2 - 1]! + vals[m / 2]!) / 2;
      };
      const withBary = layers[l]!.map((id, i) => ({ id, i, b: bary(id) }));
      withBary.sort((p, q) => (p.b === q.b ? p.i - q.i : p.b - q.b));
      layers[l] = withBary.map((p) => p.id);
    }
  }

  // coordinates: columns by max width, stacks centered on a common vertical axis.
  // Each inter-column gap fits this column's output labels + the next column's
  // input labels + a wire channel, so labels never overlap.
  const layerW = layers.map((layer) => Math.max(0, ...layer.map(width)));
  const maxOutW = layers.map((layer) =>
    Math.max(0, ...layer.map((id) => outLabelWidth(nodes[id]!))),
  );
  const maxInW = layers.map((layer) =>
    Math.max(0, ...layer.map((id) => inLabelWidth(nodes[id]!, edges))),
  );
  const layerX: number[] = [];
  let x = origin.x + (maxInW[0] ?? 0); // room for the leftmost column's input labels
  for (let l = 0; l < layers.length; l++) {
    layerX[l] = x;
    x += layerW[l]! + (maxOutW[l] ?? 0) + (maxInW[l + 1] ?? 0) + channel;
  }
  const layerH = layers.map((layer) =>
    layer.reduce((sum, id, i) => sum + height(id) + (i ? gapY : 0), 0),
  );
  const maxH = Math.max(0, ...layerH);
  const snap = (v: number) => Math.round(v / GRID) * GRID;
  for (let l = 0; l < layers.length; l++) {
    let y = origin.y + (maxH - layerH[l]!) / 2;
    for (const id of layers[l]!) {
      pos[id] = { x: snap(layerX[l]!), y: snap(y) };
      y += height(id) + gapY;
    }
  }
  return pos;
}
