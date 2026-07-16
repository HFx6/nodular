# PROJECT - nodular

A node-based code canvas where the graph is the module system.

## One-liner

nodular is a browser-native node editor where each node is a live module of real code (JS first; Python, Lua, Ruby, and compiled WASM after) and the wires between nodes replace imports and exports entirely. One language-agnostic engine runs everything; per-language adapters translate each language's idioms into a shared node contract. No import syntax anywhere.

## Positioning

nodular has been in development on and off since ~2019, before natto.dev existed. The concept has since been validated independently (natto, nodes.io) but never finished: natto is a frozen JS-only preview scoped to expressions; nodes.io never launched publicly. The enabling tech (mature Pyodide, esbuild-wasm, esm.sh, CodeMirror 6, OffscreenCanvas) only became viable recently, so the polyglot version of this idea wasn't buildable when nodular started. It is now.

Planned differentiators:

1. Performance - worker-isolated kernels, incremental per-node recompiles, coalesced streams, zero-copy frame transfer. Live media (emulators, video, GL) keeps running at full rate while you edit.
2. UI - legible typed ports, graph-aware autocomplete, handles appearing live as you type. (Design direction itself is not yet set; inspiration research lives in REF.md.)
3. Blueprints - first-class shareable subgraphs (below).
4. Live sharing and persistence - canvases save locally, sync, and share by URL.
5. Polyglot - JS + Python + Lua + Ruby + WASM in one graph, in-browser, with typed cross-language edges.

## The core idea

- Nodes contain real, idiomatic code. Double-click a node, get an editor, write a normal function. No DSL, no blocks.
- Edges are the imports. Wiring an output into a node makes that value or function available in the target's scope. Users never write an import statement in any language.
- Exports are inferred. In JS, typing `export` sprouts a handle on the node as you type. In Python, top-level defs become handles. Each language uses its own idiomatic "make public" gesture; the UI result is identical.
- The graph is always live. Spreadsheet-style reactive evaluation: edit a node and only it and its downstream re-run. Sources (emulators, video, timers, user input) push events through the graph continuously.

## What you can build

- Creative-coding patches (canvas, WebGL, audio) wired from small readable modules
- Interactive surfaces: a drawing app where the canvas's pointer stream feeds brush logic that paints back to the same canvas; a playable emulator where the canvas's keyboard stream drives the game
- Data pipelines: fetch → parse (Python/pandas) → visualize (JS/d3) in one graph
- Teaching material and demos where every intermediate value is inspectable on the canvas
- The proof-of-concept: a fully playable NES emulator node rendering into, and controlled through, a canvas node

## Pillars (priority order)

1. Legibility - you can always see what a node takes, what it gives, and where every value comes from. Renames flag broken consumers visually instead of failing at build time.
2. Liveness - no build step in the user's mental model. Edits apply incrementally; long-lived node state (a running emulator, a video stream) survives unrelated edits.
3. Real code - everything a node does is ordinary code in its language. No capability ceiling imposed by the tool.
4. Polyglot without friction - values marshal at language boundaries; cross-language calls become async and the UI communicates this rather than documentation.
5. Composability - blueprints: subgraphs copied as JSON, shared anywhere, pasted into any graph. Eventually collapsible into single nodes.

## Node families

| Family | What | Examples |
|---|---|---|
| Code nodes | User-authored modules, per language | JS/TS, Python, Lua, Ruby, precompiled WASM |
| Built-ins | Pre-made DOM/host nodes on the same contract | sources: tick, keys, pointer; controls: text input, button, slider; sinks: canvas/screen, text output; plus video, image, file drop, fetch |
| Structural | Graph-level utilities | comment/frame, subgraph, value probe |

Built-ins are dual-direction where sensible (a slider is both a source of its value and a sink for it). Rich surfaces are strict sinks: the canvas has inputs only (frames, or a render function - the surface handoff happens underneath). Interaction comes from separate source built-ins (`keys`, `pointer`) that reference a surface by setting rather than by wire, so drawing apps and playable emulators are ordinary acyclic graphs where every arrow points into the screen.

## Blueprints

A blueprint is a named, self-contained subgraph: nodes, internal edges, and exposed ports serialized as one JSON object.

- Copy anywhere: any selection copies as plain JSON, so it travels through Slack, gists, email, and git unchanged.
- Paste anywhere: rehydrates nodes and wiring; edges that crossed the selection boundary become the blueprint's dangling inputs/outputs.
- Works at any granularity, from one configured node to a whole pipeline.
- Self-describing: carries language requirements, port interface, and a preview, so a paste target can warn ("needs Python kernel") before rehydrating.
- Later: collapse into a single subgraph node; a personal blueprint shelf; share links that paste on visit.

## Platform features

- fetch - ambient in all code nodes (cancellation tied to the node's lifecycle), plus a no-code Fetch built-in. Network is a per-origin capability in shared/strict mode.
- Cloud save - local-first: IndexedDB is the source of truth, `.nodular` JSON files export without an account, cloud sync is a background target with versioning and share links.
- Copy/paste - blueprints on the clipboard as plain JSON plus a lossless app-native type. Paste fallthrough: plain text becomes a code node, an image becomes an image node, a URL becomes a pre-filled Fetch node.
- Live sharing/collab - CRDT doc (Yjs), phased: read-only share links first, then device sync and live view, then co-editing. The shared doc is the program (code + topology), never runtime state. Collaborative sessions run sandboxed.

## Execution model

Reactive dataflow: dirty-flag propagation, topological evaluation, parallel independent branches, cancellation of superseded runs. No run button by default; each node can be switched to manual run when wanted. Two port semantics: value ports (memoized, re-delivered each eval) and stream ports (ephemeral events/frames, coalesced to latest). No whole-graph bundling; JS nodes compile individually, other languages run in worker kernels. Full spec in ENGINE.md.

## End goal

A shareable web app where you open a URL, get a canvas, write real code in mixed languages, wire things together, and the graph runs continuously as you work. Graphs are JSON: saveable, shareable, forkable, embeddable read-only on any static site. The playable-NES demo should feel like a boring consequence of the architecture, not a stunt.

## Non-goals (v1)

- Full multiplayer co-editing in v1. Live sharing phases in: v1 read-only share links, v1.x synced canvases across your own devices, v2 real-time co-editing. The graph model is CRDT-friendly from day one so no rewrite is needed.
- npm package authoring/publishing from within the tool
- Server-side execution; everything runs client-side
- Mobile editing (mobile viewing of shared graphs is fine)
- A public blueprint marketplace (clipboard JSON and share links are the sharing primitives for now)

## Success criteria

- A newcomer builds slider → sine wave → canvas plot in under two minutes without docs.
- Editing one node in a 50-node graph re-evaluates in low tens of ms (excluding intentionally slow user code) and never restarts unrelated live nodes.
- A Python node consuming a JS value (and vice versa) requires zero user boilerplate.
- The editor loads fast; language kernels load lazily on first use.

## Status notes

- Engine v0 is implemented (July 2026): the language-agnostic core (dirty propagation, topo flush, epochs, abort) runs real JS via the js-expr adapter, with table/image/canvas built-ins on the node contract. Both seed demos execute for real - walkers (code → generic canvas sink) and the natto-style art browser (fetch → table → image). Python/Lua/Ruby/WASM kernels, js-module, streams, and workers slot in as new adapter/built-in registrations; see ENGINE.md's Status section for exact state and v0 deviations.
- Design standards (colors, type, spacing, node visual language) are not set. Inspiration research is in REF.md; a DESIGN.md will exist once direction is chosen.