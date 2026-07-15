// Initial demo graph (grid-aligned):
//   tick ─┐
//   count ┼→ particles ─draw→ screen
//   noise ┤       ↑
//   pointer ──────┘ (attractor)

import type { Edge, NodeMap } from "../types";

export const INITIAL_NODES: NodeMap = {
  tick: { id: "tick", lang: "ui", name: "tick", x: 54, y: 54, w: 168, kind: "tick" },
  count: { id: "count", lang: "py", name: "count", x: 54, y: 180, w: 168, code: `n = 40\nn` },
  noise: { id: "noise", lang: "py", name: "noise", x: 54, y: 342, w: 222,
    code: `import math\n\ndef field(x, y):\n    a = math.sin(x*3)\n    return a * math.cos(y*3)` },
  parts: { id: "parts", lang: "js", name: "particles", x: 342, y: 180, w: 240,
    code: `export function draw(ctx) {\n  each(count, w =>\n    w.step(field, cursor))\n  paint(ctx)\n}` },
  ptr: { id: "ptr", lang: "ui", name: "pointer", x: 342, y: 450, w: 186, kind: "pointer", target: "screen" },
  cvs: { id: "cvs", lang: "canvas", name: "screen", x: 666, y: 180, w: 288, ins: ["render"] },
};

export const INITIAL_EDGES: Edge[] = [
  { id: "e1", from: ["tick", "→"], to: ["parts", "tick"], sample: "t=48213 · 60/s", stream: true },
  { id: "e2", from: ["count", "→"], to: ["parts", "count"], sample: "40 · num" },
  { id: "e3", from: ["noise", "field"], to: ["parts", "field"], xlang: "py→js", sample: "ƒ field(x, y) → num" },
  { id: "e4", from: ["ptr", "→"], to: ["parts", "cursor"], sample: "{x: 214, y: 96}", stream: true },
  { id: "e5", from: ["parts", "draw"], to: ["cvs", "render"], sample: "ƒ draw(ctx)" },
];
