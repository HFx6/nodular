// Built-in node definitions on the engine's node contract. Bodies stay React
// in v0 (the engine publishes resolved inputs; interactions call emit) — a
// pragmatic deviation from ENGINE.md's setup(host) DOM mounting that doesn't
// touch the core when it changes. tick/pointer are not registered yet: they
// need stream semantics.

import type { NodeDefinition } from "../core/types";

/** table: `rows` in, the clicked row out on "→" (natto's model — the table is
 *  the picker). update returns undefined so the sticky selection held in the
 *  engine's node state survives upstream re-evals. */
export const tableDef: NodeDefinition = {
  iface: () => ({ ins: ["rows"] }),
  create: () => ({ update: () => undefined }),
};

/** image: `url` in, pure sink. */
export const imageDef: NodeDefinition = {
  iface: () => ({ ins: ["url"] }),
  create: () => ({ update: () => undefined }),
};

/** import: a package name or URL in n.code; the React body loads it (via esm.sh
 *  for bare names, or the URL directly) and emits the module — or module.default
 *  when GraphNode.useDefault — on "→". Pure source, no inputs. */
export const importDef: NodeDefinition = {
  iface: () => ({ ins: [] }),
  create: () => ({ update: () => undefined }),
};

/** text: the editor value IS the value (natto's text pane). The React body
 *  emits n.code as a string on "→" whenever it changes. Pure source. */
export const textDef: NodeDefinition = {
  iface: () => ({ ins: [] }),
  create: () => ({ update: () => undefined }),
};

/** state: holds a value; "→" carries the current value, the named `set` port
 *  carries a stable setter (natto's state pane). The React body owns both via
 *  a ports-record emit; update returns undefined so the held value survives. */
export const stateDef: NodeDefinition = {
  iface: () => ({ ins: [] }),
  create: () => ({ update: () => undefined }),
};

/** canvas: `render` in — a ƒ(ctx, frame) the surface calls in its own rAF
 *  loop (frame = { t, dt, width, height, cursor }). Pure sink; the body owns
 *  the loop and the pointer, so any render function works against it. */
export const canvasDef: NodeDefinition = {
  iface: (n) => ({ ins: n.ins ?? ["render"] }),
  create: () => ({ update: () => undefined }),
};
