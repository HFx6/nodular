// Initial demo graph (grid-aligned) — walkers, built from real nodes:
//   count ──┐
//   field ──┼→ walkers ─→ screen
// count and field are plain js-expr values (a number, a function) flowing over
// wires; walkers' last expression is a draw ƒ(ctx, frame) with closure state;
// screen is the generic canvas sink calling it every animation frame.

import type { Edge, NodeMap } from "../types";

const WALKERS_CODE = `const ws = []

const draw = (ctx, { width: w, height: h, cursor }) => {
  const n = count ?? 40
  while (ws.length < n)
    ws.push({ x: Math.random() * w, y: Math.random() * h, trail: [] })
  ws.length = Math.min(ws.length, n)

  ctx.fillStyle = "#242331"
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = "rgba(217,215,235,.55)"
  ctx.lineWidth = 1

  for (const p of ws) {
    let dx = (Math.random() - 0.5) * 4
    let dy = (Math.random() - 0.5) * 4
    if (field) {
      const a = field(p.x / 48, p.y / 48) * Math.PI * 2
      dx += Math.cos(a) * 1.1
      dy += Math.sin(a) * 1.1
    }
    if (cursor) {
      dx += (cursor.x - p.x) * 0.012
      dy += (cursor.y - p.y) * 0.012
    }
    p.x = Math.max(0, Math.min(w, p.x + dx))
    p.y = Math.max(0, Math.min(h, p.y + dy))
    p.trail.push([p.x, p.y])
    if (p.trail.length > 14) p.trail.shift()
    ctx.beginPath()
    p.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  }

  if (cursor) {
    ctx.fillStyle = "#d9a13f"
    ctx.fillRect(cursor.x - 2, cursor.y - 2, 4, 4)
  }
}

draw`;

export const INITIAL_NODES: NodeMap = {
  count: { id: "count", lang: "js", name: "count", x: 54, y: 54, w: 234, code: `40` },
  field: { id: "field", lang: "js", name: "field", x: 54, y: 216, w: 240,
    code: `(x, y) =>\n  Math.sin(x * 3) * Math.cos(y * 3)` },
  walkers: { id: "walkers", lang: "js", name: "walkers", x: 342, y: 54, w: 360, h: 396, code: WALKERS_CODE },
  cvs: { id: "cvs", lang: "canvas", name: "screen", x: 756, y: 54, w: 288, ins: ["render"] },
};

export const INITIAL_EDGES: Edge[] = [
  { id: "e1", from: ["count", "→"], to: ["walkers", "count"], sample: "…first value pending" },
  { id: "e2", from: ["field", "→"], to: ["walkers", "field"], sample: "…first value pending" },
  { id: "e3", from: ["walkers", "→"], to: ["cvs", "render"], sample: "…first value pending" },
];
