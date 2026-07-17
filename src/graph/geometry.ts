// Pure spatial model of the graph doc: which ports a node has, where they sit,
// and the bezier path of each edge. No React, no side effects.

import { HEAD, ROW } from "../theme";
import { outsFor } from "../engine/inference";
import type { Edge, ExportInfo, GraphNode, NodeMap } from "../types";
import type { SizeMap } from "./sizeStore";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function outsOf(n: GraphNode): ExportInfo[] {
  // built-ins declare fixed named outputs in the doc (state's "set"); code nodes infer them
  if (n.lang === "ui" || n.lang === "canvas") return (n.outs ?? []).map((name) => ({ name, fn: true }));
  return outsFor(n);
}

export function inputsOf(n: GraphNode, edges: Edge[]): string[] {
  if (n.ins) return n.ins;
  if (n.lang === "canvas") return [];
  const seen: string[] = [];
  edges.forEach((e) => { if (e.to[0] === n.id && !seen.includes(e.to[1])) seen.push(e.to[1]); });
  return seen;
}

/** Best-effort node height when the DOM hasn't measured it yet (first paint,
 *  auto-layout run before render). Measured › doc `h` › this estimate. */
export function estimateHeight(n: GraphNode, edges: Edge[]): number {
  if (n.min) return HEAD;
  const ports = Math.max(inputsOf(n, edges).length, outsOf(n).length);
  const portBlock = HEAD + 16 + ports * ROW;
  if (n.lang === "js" || n.lang === "py") return Math.max(portBlock, n.h ?? 140);
  if (n.lang === "canvas") return Math.max(portBlock, n.h ?? 180);
  return Math.max(portBlock, 60);
}

/** Narrowest width where the header still fits every control plus the full
 *  title — the resize clamp, so a title is never truncated. Mirrors the
 *  NodeCard header: padding 18, × – (~8 each), title (12.5px mono bold
 *  ≈7.6px/char) + lang tag, sliders/mode/run for code nodes, the → port, and
 *  8px gaps between items. */
export function minNodeWidth(n: GraphNode): number {
  const isCode = n.lang !== "canvas" && n.lang !== "ui";
  const title = Math.ceil(n.name.length * 7.6);
  // padding + × – + title + → + gaps(4 items→3 gaps... measured generously)
  if (!isCode) return 76 + title + (n.lang === "canvas" ? 12 : 0);
  // + lang tag (17), sliders (12), mode chip ("manual ▾" ≈ 46), run (12), 3 more gaps
  return 187 + title;
}

/** The node's board-space rectangle: doc width, height from measured › doc › estimate. */
export function nodeRect(n: GraphNode, sizes: SizeMap, edges: Edge[]): Rect {
  return { x: n.x, y: n.y, w: n.w, h: sizes[n.id]?.h ?? n.h ?? estimateHeight(n, edges) };
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

/** The plain horizontal-tangent cubic bezier: control points pushed sideways by
 *  a min-38 / 42%-of-span offset. Used for clear routes and as the router's
 *  fallback. */
export function directBezier(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const dx = Math.max(38, Math.abs(b.x - a.x) * 0.42);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
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
  return { a, b, broken, d: directBezier(a, b) };
}
