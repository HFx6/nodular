// npm import example (natto.dev's pattern, with nanoid): the import built-in
// loads `nanoid` from npm (rewritten to esm.sh under the hood), emits the module
// namespace on "→", and a plain js node calls the library to produce an id.
//   nanoid (import) ─→ id (js: nanoid.nanoid())
// Showcases NEXT #1: real npm modules in the browser with no build step.

import type { Edge, NodeMap } from "../types";

export const NANOID_NODES: NodeMap = {
  lib: {
    id: "lib", lang: "ui", name: "nanoid", x: 108, y: 126, w: 300,
    kind: "import", ins: [], code: "nanoid", useDefault: false,
  },
  id: {
    id: "id", lang: "js", name: "id", x: 492, y: 126, w: 264,
    code: "nanoid.nanoid()",
  },
};

export const NANOID_EDGES: Edge[] = [
  { id: "n1", from: ["lib", "→"], to: ["id", "nanoid"], sample: "…loading nanoid" },
];
