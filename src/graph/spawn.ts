// The add-node palette: every node type the top bar can spawn, with its
// default doc shape. Config-driven so the TopBar dropdown and addNode never
// enumerate kinds themselves (natto's pane-type menu).
//
// Node types vs render modes (the "should table be a node type?" question):
// dedicated UI kinds exist only where the node has interaction semantics —
// table picks a row and emits it, text/state are sources, import loads a
// module. Pure *views* of a computed value are NOT node types: any eval node
// renders as table/text/html via its renderMode (⚙ → render output). New ways
// to display data should extend RenderMode, not this palette.

import type { GraphNode } from "../types";

export type SpawnKind = "eval" | "import" | "text" | "state" | "table" | "image" | "canvas";

export const SPAWN_KINDS: Array<{ kind: SpawnKind; label: string; toast: string }> = [
  { kind: "eval", label: "eval node", toast: "new node — start typing" },
  { kind: "import", label: "import node", toast: "import node — type a package name or url" },
  { kind: "text", label: "text node", toast: "text node — its value is the text" },
  { kind: "state", label: "state node", toast: "state node — value out, set() out" },
  { kind: "table", label: "table node (row picker)", toast: "table node — wire rows in, click a row to emit it" },
  { kind: "image", label: "image node", toast: "image node — wire a url in" },
  { kind: "canvas", label: "canvas node", toast: "canvas node — wire a render function in" },
];

/** Default doc node for a palette kind, at board coords (grid-snap is the store's job). */
export function spawnNode(id: string, at: { x: number; y: number }, kind: SpawnKind): GraphNode {
  const base = { id, x: at.x, y: at.y, w: 204 };
  switch (kind) {
    case "import":
      return { ...base, lang: "ui", kind, name: "import", ins: [], useDefault: true };
    case "text":
      return { ...base, lang: "ui", kind, name: "text", ins: [], code: "" };
    case "state":
      return { ...base, lang: "ui", kind, name: "state", ins: [], outs: ["set"], code: "" };
    case "table":
      return { ...base, lang: "ui", kind, name: "table", ins: ["rows"], w: 280 };
    case "image":
      return { ...base, lang: "ui", kind, name: "image", ins: ["url"], w: 240 };
    case "canvas":
      return { ...base, lang: "canvas", name: "canvas", ins: ["render"], w: 288 };
    case "eval":
      return { ...base, lang: "js", name: id, code: "1 + 1" };
  }
}
