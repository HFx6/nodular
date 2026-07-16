# ENGINE — nodular

Technical spec: architecture, execution model, language adapters, surfaces, platform services, performance. Decisions recorded here are working decisions, revisable; open questions are listed at the end. Implementation status is tracked in the "Status" section at the bottom.

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React 19 + TypeScript + Vite | |
| Graph canvas | **Bespoke** (decided): absolutely-positioned pane divs + hand-drawn SVG wires + one CSS view transform for pan/zoom | natto's approach, validated by our own mockups (~60 lines for pan/zoom/snap/wiring/collapse). ReactFlow was evaluated and covers ~80%, but its friction lands on nodular's signature interactions — see rationale below |
| Code editing | **CodeMirror 6**, one real instance per pane | Chosen over Monaco: Monaco's global reference model resists many-instances-on-one-surface (our exact case), forces inline styling (no CSS vars), and adds a 2–5MB / 1–3s load; CodeMirror inits in <100ms, themes are plain CSS, and it's what natto/Observable/Replit use. Highlighting for every language via Lezer/tree-sitter grammars; deeper intelligence via LSP-over-worker (shares the kernel infra). Trade: no free TS IntelliSense — recovered by running a TS language server as one more worker kernel, which suits a polyglot tool where TS isn't privileged |
| State | Zustand for the graph doc; runtime state owned by the engine, outside React | Engine ticks must never re-render chrome |
| JS transform | esbuild-wasm `transform()` only | Per-node TS/JSX strip. Single-file transform is the robust subset; in-browser `build()` needs a fragile CDN-resolver plugin stack we deliberately avoid |
| JS export inference | es-module-lexer | ~4KB, microsecond scans on keystroke |
| JS module loading | Blob-URL ES modules + import map → esm.sh | The browser is the bundler; npm via CDN |
| Kernels | One Web Worker per language, lazy-loaded | Isolation, kill-ability, main thread stays responsive |
| Python | Pyodide | Best JS FFI, micropip, numpy/pandas/matplotlib |
| Lua | wasmoon | Tiny, fast startup, trivial env injection |
| Ruby | ruby.wasm + Prism for parsing | Official CRuby build |
| Sandboxed JS | quickjs-emscripten | Strict mode for untrusted/shared graphs |
| C/C++/Rust | Precompiled `.wasm` upload (v1) | Exports section gives port inference for free; in-browser clang later if ever |
| Persistence | Plain JSON doc; IndexedDB + `.nodular` export; Supabase for sync | Flat id-keyed maps + per-node code strings = CRDT-friendly |
| Collab (phased) | Yjs (+ y-codemirror.next, Awareness) | Node code as Y.Text gets collaborative CodeMirror editing with cursors for free |
| Media interchange | OffscreenCanvas, ImageBitmap, VideoFrame, transferables; Comlink candidate for kernel RPC | Zero-copy frames across workers |

### Why these and not others

- Graph canvas: bespoke, decided. ReactFlow was evaluated seriously (twice) and covers roughly 80% of the need — pan/zoom, snapGrid, custom nodes, edges. The remaining 20% is nodular's signature and is where ReactFlow fights back: handles created/destroyed by keystrokes require updateNodeInternals re-measurement on every edit; port labels floating outside the node bounds break its hit-testing model; click-to-wire, wires re-anchoring on pane collapse, and live canvases inside nodes all need escape hatches. Our bespoke mockups covered pan, zoom-at-cursor, grid snap, wiring, collapse, and delete in about 60 lines with no fights, matching natto (also fully bespoke, and the interaction-quality benchmark). Accepted cost, owed to ourselves: box-select, minimap, undo/redo, multi-select drag, touch support — all things ReactFlow would have provided.
- Custom engine over off-the-shelf: nothing covers value+stream ports, epoch cancellation, and cross-worker kernels together. Observable's runtime is closest (steal its laziness/invalidation shapes) but is main-thread, name-based, JS-only. Rete's engine has no cancellation or streams. natto's engine is `new Function('inputs', expr)` re-run by React state subscriptions, which is exactly why it stayed JS-only and expression-scoped.

## Omni engine + LanguageAdapter

One language-agnostic engine; one adapter file per language. The engine (dirty propagation, topological layers, epochs, value/stream semantics, coalescing, boundary records) never branches on language.

```ts
interface LanguageAdapter {
  id: 'js-expr' | 'js-module' | 'python' | 'lua' | 'ruby' | 'wasm';

  // Parse code → declared surface (drives handles + validation)
  inferInterface(code: string): { outputs: Port[]; freeInputs: string[] };

  // Code + resolved inputs → executable instance
  instantiate(code: string, ctx: KernelContext): Promise<Executable>;

  marshal: {
    toHost(v: LangValue): HostValue;      // e.g. PyProxy → JS
    fromHost(v: HostValue): LangValue;
    wrapFn(fn: LangFn): AsyncHostFn;      // cross-language calls become async
    canTransfer(v: unknown): boolean;     // ImageBitmap/ArrayBuffer fast path
  };

  typeSurface(outputs: Port[]): PortTypeInfo[];  // best-effort, per language
}
```

Adding a language touches only a new adapter. (@tani/polyglot converged on nearly this shape, including type marshalling; it has no C/C++/C# support, which is where our `wasm` adapter covers precompiled Emscripten/wasm-bindgen artifacts.)

Two JS adapters, selected automatically by whether the code contains module syntax:

- `js-expr` — `AsyncFunction` compile (so `await fetch(...)` works bare) with wired inputs as named parameters and a lifecycle-wrapped `fetch` injected. Bare expressions compile as `return (code)`; statement bodies get a `return` spliced around the last top-level expression (acorn finds it) — "the last expression is the value". No URL churn, instant recompile. (Implemented.)
- `js-module` — blob-URL ES module for anything with `export` or top-level state. Real live bindings, npm via import map. (Future; module code currently publishes a static "exports carry the value" result.)

```
┌─ React (chrome only) ────────────────────────────────┐
│  bespoke pane canvas · CodeMirror panes · inspectors │
└──────────────▲───────────────────────────────────────┘
               │ node defs, port UI, state badges
┌──────────────┴───────────────────────────────────────┐
│  Omni Engine (framework-free TS)                     │
│  dirty-props · topo layers · epochs · emit/coalesce  │
└───▲─────▲──────────▲──────────▲──────────▲──────▲────┘
 js-expr js-module Built-ins  python     lua    wasm
                   (DOM nodes, same contract)
```

## Node contract

Every node, built-in or code, implements:

```ts
interface NodeDefinition {
  interface(config): { inputs: Port[]; outputs: Port[]; derives?: DerivationMap };
  create(ctx: CreateContext): NodeInstance;
}

interface NodeInstance {
  setup?(host: HTMLElement | null, ctx: NodeContext): void | Promise<void>; // built-ins mount DOM here
  update(inputs: Record<string, unknown>, ctx: NodeContext):
    Record<string, unknown> | void | Promise<Record<string, unknown> | void>;
  teardown?(): void;
}

interface NodeContext {
  signal: AbortSignal;                       // aborted when superseded/removed
  emit(port: string, value: unknown): void;  // push sources (emulators, inputs)
}
```

A code node is an adapter wrapped in this shape; a built-in is a hand-written instance. The engine can't tell them apart.

## Execution model

- Pull-based reactive dataflow with dirty flags (spreadsheet semantics). Any mutation (code edit, edge add/remove, node add/delete) marks the affected node and its downstream dirty and schedules a flush.
- Flush = topological sort of the dirty subgraph, evaluated in layers; independent branches run in parallel.
- First load = everything dirty = whole-graph evaluation. Same code path as an incremental edit.
- Epoch counters per node: superseded evaluations are discarded, not applied. AbortSignal is threaded into user code and wrapped fetch; workers hard-terminate on watchdog timeout with a visible "node killed" state.
- Two port semantics: value ports (memoized, re-delivered each eval) and stream ports (ephemeral events/frames). Streams coalesce to latest per port and flush once per animation frame, giving backpressure; per-edge opt-out for consumers that need every sample (pressure-sensitive brushes).
- `emit` marks only downstream consumers dirty, not the emitter.
- Cycles are detected on declared derivation, not node identity. Each interface can state which outputs derive from which inputs (`derives`); code nodes default to all-on-all, built-ins declare explicitly. The canvas's pointer output is independent of its frame input, so canvas → pointer → brush → frame → canvas is legal. True derivation cycles are rejected on connect in v1; a "delay" edge (previous-tick value) may come later.

## Legibility mechanisms

- Inputs are injected, never imported. JS: generated import prelude from edges (invisible to the user) or pre-bound values. Python: globals dict. Lua: env table. Ruby: binding locals.
- Exports are inferred. JS: `export` keyword via lexer, live on keystroke. Python: top-level defs / `__all__`. Lua: return table. Ruby: top-level defs/constants. WASM: exports section.
- Default output ("result"): every code node has an implicit result port carrying the value of its last expression, in addition to named exports. Per language: js-expr = the expression; js-module = `export default`; Python = last expression (Pyodide's runPython returns this natively); Ruby = last expression (native semantics); Lua = the chunk's return; WASM = none, named exports only. Enforcement is by feedback, not syntax rules: the result port is always visible with a live kind badge, and when the last statement is a definition/assignment (so nothing evaluates) the port shows "no result — last line defines X" with one-click fixes (append a call, or expose as export). New nodes carry per-language ghost text stating the convention. Bare `return` at top level is not required and in Python would be invalid anyway.
- Node modes (natto-derived, auto-first): each node carries a **value mode** — `auto` (default: inferred; module syntax → module, bare expression → expression) | `expression` | `function body` (user writes `return`) | `module` | `text` — as a small header setting. Auto covers the vast majority; the setting handles ambiguous cases and doubles as legibility, since it displays what the system inferred. Each node also carries a **face mode** — `auto` (render body by observed type: value inspector, image, text, surface) | `value` | `hidden`.
- Connection model: ports and wires are the single source of truth (legible graph), with a code-first shortcut layered on so wiring rarely means leaving the keyboard. Typing an unresolved name in a pane offers a quick-fix that sprouts a dangling input port; that port then offers a search of in-scope outputs (name/type-matched) to complete the wire. Dragging a wire to empty canvas offers a new pre-wired pane. This is the middle path between natto's consumer-side picker (great keyboard flow, poor graph legibility, no home for typed/stream/multi-export ports) and a pure handle model (legible but ceremonious); nodular keeps the legible handles and grafts on the low-ceremony feel.
- Editing is in-pane: every code pane hosts its own CodeMirror 6 instance (cheap to instantiate, so dozens can be live at once), edited where it lives, natto-style. The collapsible side rail offers a larger focused editor for the selected pane. Per-language highlighting comes from Lezer/tree-sitter grammars; graph-aware autocomplete and diagnostics come from LSP servers running in the same worker kernels the languages already use. Pane chrome is minimal and fully functional: × delete, – collapse to header (wires re-anchor to the header), name, language tag, run-mode toggle (auto by default; manual reveals a run button), and the header → which is the pane's value port.
- Board navigation: drag the background to pan, wheel/trackpad scroll pans, pinch or ctrl+wheel zooms around the cursor. Panes drag by their headers and snap to the background grid. All of it flows through one CSS view transform, which is also the seam where a future minimap and box-select attach.
- Bodies show what the node is right now: a node's body renders its current value live by default (arrays/objects as inspector trees, images as images), natto-style, updating as the graph runs; code lives in the side editor with a peek on the node. The canvas built-in is the extreme case: its body IS the surface — one or two inputs at the header, the entire body the live picture, no port furniture, no outputs at all (interaction comes from separate source built-ins; see DOM & surfaces). A Display built-in remains for showing another node's value elsewhere, but simple cases need no extra node — the node is its own display.
- Editor graph-awareness: incoming edges synthesize declarations fed to each pane's language server (for TS, the equivalent of ambient `declare const ...`); cross-language functions are surfaced as Promise-returning so `await` is enforced. Where a language has no server yet, panes still get highlighting plus the runtime-sample tooltips on edges.
- Edge = one labeled binding; local renames live on the edge. Renaming an export flags consumers visually rather than failing a build.
- Boundary record: every node's result normalizes to `{ name → value | asyncFn | stream }`. All UI, validation, and RPC consume only this record.
- Type checking in three tiers: (1) kind checks (value/function/stream/canvas) always, at connect time and at runtime when values cross; (2) static types where free — full TS via a TS language server (worker), Python hints as soft tooltips only, exact WASM signatures; (3) no cross-language type unification — instead every edge carries a runtime sample of its last value, inspectable on hover.

## DOM & surfaces

DOM lives on the main thread inside built-ins. No DOM proxying (via.js evaluated and rejected: per-property async round-trips or SharedArrayBuffer/COOP-COEP requirements, unmaintained). Three cases cover everything:

1. Main-thread JS ↔ built-ins: direct. A JS node receives `{ canvas, ctx2d }` and draws synchronously.
2. Worker code owning a surface: `transferControlToOffscreen()` hands the worker a real 2d/WebGL context; pixels appear on-screen with no main-thread involvement. Pyodide drives it through its JS FFI. Transfer is one-way and permanent, so the canvas built-in tracks local vs remote mode and recreates + re-transfers the element on rewire.
3. Everything else: data over ports — ImageBitmap/ImageData/VideoFrame (transferable, zero-copy), never DOM references.

Interaction: events are not canvas ports at all. They come from separate source built-ins — `keys`, `pointer` (canvas-coord {type,x,y,buttons,pressure}, plus resize) — each of which references a surface by a node setting ("surface: screen"), not by a wire. The canvas therefore has inputs only and reads as a pure sink; the graph stays acyclic (keys → logic → screen, all arrows one direction), which removes the need for the derivation-map cycle exception in this case (the derivation rule stays for genuinely dual-direction built-ins like sliders driven from upstream). Under the hood the source node subscribes to the on-screen element's events, which the element still receives even after offscreen transfer. Events forward to workers as small serializable objects through the standard stream machinery; pointermove coalesces to latest by default with a per-edge "every sample" opt-out for pressure-sensitive brushes. Drawing app = pointer(surface: screen) → brush logic → render/frame → screen. Playable emulator = keys(surface: screen) → emulator → frame → screen.

Direction reads into the sink: the canvas exposes no visible surface output. Its inputs are `frame` (data) and `render ƒ(ctx)` (a draw function). Wiring a renderer into `render` is what hands that node the surface or OffscreenCanvas underneath — surface/offscreen transfer is an implementation detail of the connection, so every arrow points into the screen ("my node plugs into the display").

Other built-ins follow the same pattern in a few lines each: input/slider/button are main-thread components whose ports carry plain values and event pulses; video outputs its element plus a VideoFrame stream via requestVideoFrameCallback.

## Platform services

- fetch: native everywhere (workers included; Pyodide has pyfetch/micropip). A wrapped fetch carrying the node's epoch AbortSignal is injected so superseded evals cancel in-flight requests. Fetch built-in for the no-code path (url/method/headers/body in; response/json/error out; debounce + manual trigger). CORS handled honestly: optional per-graph proxy toggle (small Cloudflare Worker). In strict/shared mode, network is a capability: off by default, per-origin allowlist, prompt on first use.
- Cloud save: local-first. IndexedDB is the source of truth; `.nodular` file export works without an account; Supabase for sync (graphs + graph_versions with content-hash dedupe, RLS for private/unlisted/public); share links are public-read rows. Durable Objects remain available later as a collab transport without a storage migration.
- Clipboard: dual-write `text/plain` (pretty JSON, survives any channel) + `web application/x-nodular+json` (lossless). Paste pipeline: parse → schema-validate → remap ids → offset to cursor → check language requirements against loaded kernels, offer lazy-load. Fallthrough: plain text → code node; image → image node; URL → pre-filled Fetch node. Blueprint envelope: `{ "$schema": "nodular/blueprint@1", meta: {name, langs, thumbnail}, nodes, edges, exposedPorts }`; boundary-crossing edges become the exposed port list.
- Live sharing/collab: Yjs. Nodes/edges as Y.Maps, node code as Y.Text (y-codemirror.next gives collaborative editing with cursors), Awareness for presence. Phases: v1 static-snapshot read-only viewer (no realtime infra) → v1.x one-way live view + device sync (y-websocket or y-durableobjects) → v2 co-editing on the same doc. Sync the program, never the runtime: each client runs its own engine; spectator views of live output are a separate lossy layer (sampled port values / canvas snapshots as ephemeral data). Collab sessions force strict mode — someone else's edits executing on your machine is untrusted code, so sandboxed JS and capability-gated network are mandatory there. The capability plumbing is built early for this reason.

## Languages

| Language | Runtime / adapter | Export inference | Input injection | Load cost | Tier |
|---|---|---|---|---|---|
| JS (expressions) | js-expr: `new Function` | n/a (single value out) | function arg | ~0 | 1 — launch |
| JS/TS/JSX (modules) | js-module: blob-URL modules (+esbuild transform) | es-module-lexer | generated import prelude | ~0 | 1 — launch |
| Python | Pyodide (worker) | `ast.parse` in-kernel | globals dict | heavy, cached | 1 — launch |
| Lua | wasmoon (worker) | return table / luaparse | env table | tiny | 2 |
| Ruby | ruby.wasm (worker) | Prism | binding locals | medium | 2 |
| WASM (C/C++/Rust artifacts) | direct instantiate (worker) | exports section | imports object | per module | 2 |
| Sandboxed JS | quickjs-emscripten | lexer | env object | small | 3 — shared-graph mode |
| C# / .NET | dotnet-wasm | reflection | interop | very heavy | backlog |

Cross-language rule shown in UI: data crosses freely (cloned/transferred), functions cross as async, DOM/canvas crosses as a render-function connection or frame stream. Every code node additionally carries the implicit `result` port (last-expression value; see Legibility mechanisms), which is what simple display/consumer nodes wire to by default.

## Performance budgets

Desktop, mid-tier laptop:

| Thing | Budget |
|---|---|
| App shell interactive | < 1.5s (kernels and esbuild all lazy) |
| esbuild-wasm init | lazy on first JS-node edit, in a worker |
| Keystroke → handles update | < 16ms (lexer is µs; debounce transform ~150ms) |
| Edit → downstream re-eval, 50-node graph of trivial nodes | < 50ms |
| Stream throughput (emulator at 60fps → canvas) | no main-thread jank; transferable frames, coalesce to latest |
| Pyodide first load | seconds cold; inline progress on the node, service-worker cached, instant after |
| wasmoon first load | < 500ms |

Tactics: heavy work in workers; pane components memoized so engine ticks never re-render chrome; DOM hosts mounted once and never re-created by React (ref-stable); inspectors sample at rAF, not per emit; graph ops are O(dirty subgraph); the whole board pans/zooms as one transform so navigation never touches pane internals.

## Security

Default mode is your own code on your own machine: blob-module JS runs with full page authority, same as any playground. Shared/embedded/collab graphs run in strict mode: JS in QuickJS, kernels already isolated, network off by default with a per-origin allowlist. The mode is always visible on the canvas; never mixed silently.

## Status (implemented so far — July 2026)

Engine v0 is real and running (`app/src/engine/`). What exists:

- **Core** (`core/engine.ts`, framework-free singleton): dirty propagation from a zustand-doc diff, downstream closure + Kahn topo flush (sequential, coalesced via microtask; parallel layers deferred), per-node epoch counters, per-eval AbortController, cycle detection → error result. Value ports only; the "→" value port carries raw values downstream. Results publish to a vanilla zustand store React reads via per-id hooks — engine never reads it back.
- **Registries** (`core/registry.ts`): the core dispatches only through `LanguageAdapter` and `NodeDefinition` — never branches on language. Registered: js (expr real, module static), py (static heuristic until the Pyodide kernel), table, image, canvas.
- **Built-ins on the node contract** (`builtins/`): table (`rows` in, clicked row out on "→" via emit), image (`url` sink), canvas (`render` sink — ƒ(ctx, frame) called in the surface's own rAF loop).
- **Demos run for real**: walkers (count/field/draw as plain js-expr nodes → canvas) and the art browser (fetch → table → url expr → image).

Deliberate v0 deviations from this spec, to revisit:

1. **Built-in bodies are React components**, not `setup(host)` DOM mounts. The engine publishes resolved inputs to the results store; bodies render from that and interactions call emit. The engine-side contract is already `NodeDefinition`, so moving DOM ownership into `setup(host)` later doesn't touch the core.
2. **The canvas hands its renderer `frame = { t, dt, width, height, cursor }`** instead of separate tick/pointer stream sources — those need stream semantics, which don't exist yet. When streams land, tick/pointer become real source built-ins per the "DOM & surfaces" section and the frame record slims down.
3. **Named-export edges deliver undefined** (only "→" edges carry values) until js-module instantiation exists.
4. No workers, no watchdog, no esbuild transform, no streams, no `derives` map yet.

## Open questions

- Use @tani/polyglot for tier-2 kernels vs writing our own adapters. Leaning own (transferable fast paths and the per-language LSP/typeSurface hooks are nodular-specific), but it's a legitimate shortcut.
- Canvas keyboard focus model details (capture affordance, release, multiple canvases).
- How many live CodeMirror instances stay smooth on one board before virtualizing offscreen panes to a static highlight; where that threshold sits.
- Feedback/delay edges: semantics and UI for previous-tick values.
- Whether js-expr and js-module should be user-visible at all or purely an implementation detail.
- Blueprint schema versioning and migration policy.