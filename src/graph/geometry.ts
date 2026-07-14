// Pure spatial model of the graph doc: which ports a node has, where they sit,
// and the bezier path of each edge. No React, no side effects.

import { HEAD, ROW } from "../theme";
import { jsExports, pyDefs } from "../engine/inference";
import type { Edge, ExportInfo, GraphNode, NodeMap } from "../types";

export function outsOf(n: GraphNode): ExportInfo[] {
  if (n.lang === "canvas" || n.lang === "ui") return [];
  if (n.lang === "js") return jsExports(n.code ?? "");
  return pyDefs(n.code ?? "");
}

export function inputsOf(n: GraphNode, edges: Edge[]): string[] {
  if (n.lang === "canvas") return n.ins ?? [];
  const seen: string[] = [];
  edges.forEach((e) => { if (e.to[0] === n.id && !seen.includes(e.to[1])) seen.push(e.to[1]); });
  return seen;
}

export interface PortPoint {
  x: number;
  y: number;
  missing?: boolean;
}

export function portPos(n: GraphNode, port: string, side: "in" | "out", edges: Edge[]): PortPoint {
  if (n.min) return { x: side === "in" ? n.x : n.x + n.w, y: n.y + HEAD / 2 };
  if (side === "out") {
    if (port === "→") return { x: n.x + n.w, y: n.y + HEAD / 2 };
    const outs = outsOf(n);
    const i = outs.findIndex((o) => o.name === port);
    if (i < 0) return { x: n.x + n.w, y: n.y + HEAD + 12, missing: true };
    return { x: n.x + n.w, y: n.y + HEAD + 16 + i * ROW };
  }
  const ins = inputsOf(n, edges);
  const i = ins.indexOf(port);
  return { x: n.x, y: n.y + HEAD + 14 + Math.max(i, 0) * ROW };
}

export interface WireGeometry {
  a: PortPoint;
  b: PortPoint;
  broken: boolean;
  d: string;
}

export function wireGeometry(e: Edge, nodes: NodeMap, edges: Edge[]): WireGeometry | null {
  const s = nodes[e.from[0]], d = nodes[e.to[0]];
  if (!s || !d) return null;
  const a = portPos(s, e.from[1], "out", edges);
  const b = portPos(d, e.to[1], "in", edges);
  let broken = !!a.missing;
  if (e.from[1] !== "→" && (s.lang === "js" || s.lang === "py") && !outsOf(s).some((o) => o.name === e.from[1])) broken = true;
  const dx = Math.max(38, Math.abs(b.x - a.x) * 0.42);
  return { a, b, broken, d: `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}` };
}
