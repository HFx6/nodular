# NEXT - nodular roadmap after engine v0

Ordered work queue, **ranked by product value + alignment** (legibility and the two-minute-sketch promise first, heavy infrastructure parked until something needs it). Written to be self-contained for future sessions: each item says what it is, why it's ranked there, where it lands in the code, and what it unblocks. Specs referenced: PROJECT.md (product), ENGINE.md (technical - see its **Status** section for exactly what v0 implemented and the recorded deviations), REF.md (research), issues.md (scoped UX/polish items).

Baseline (July 2026): engine v0 shipped — language-agnostic core in `app/src/engine/core/` (dirty propagation, downstream closure + Kahn topo flush, epochs, per-eval AbortController, value ports only), js-expr AND js-module adapters both real (`adapters/js.ts`; modules compile to blob-URL ES modules, bare npm specifiers rewritten to esm.sh, named exports delivered via the generic `portValue()` in `core/engine.ts`), py as a static-heuristic adapter, built-ins: table/image/canvas/import/text/state (`builtins/`, React bodies), manual-run barrier + ▷, per-node valueMode/renderMode with a `ValueFace`, config-driven add-node palette. Results via a vanilla zustand store (`core/resultsStore.ts`). Walkers, art browser, nanoid, and NES demos run for real.

Done and struck from the queue: **js-module adapter + import built-in** (July 2026 — details in ENGINE.md Status; deviation #3 resolved), **manual run mode** (▷ + propagation barrier), **text/state built-ins + ports-record `PORTS` mechanism**, **renderMode/valueMode settings + ValueFace** (the first half of value faces).

---

## 1. Streams - the second port semantics

**What**: ENGINE.md "Execution model": stream ports are ephemeral events/frames that **coalesce to latest per port and flush once per animation frame** (backpressure), with a per-edge opt-out for every-sample consumers. v0 implemented value semantics only; `PortSemantics` in `core/types.ts` already declares `"value" | "stream"` for this.

**Why first**: it's the biggest remaining semantic gap and everything animated or interactive queues behind it — tick and pointer as real source built-ins (their bodies in `nodes/SourceNodeBody.tsx` are placeholders), the slider/button controls being interesting (item 3), and paying down v0 deviation #2: the canvas currently hands its renderer `frame = { t, dt, width, height, cursor }` because there was no other way to move per-frame data. With streams, tick/pointer become nodes again and the frame record slims down.

**How**:

- Scheduler: `emitValue` (`core/engine.ts`) grows a stream path - instead of dirtying downstream immediately, buffer latest-per-port and flush the batch on `requestAnimationFrame`. Value emits keep the current microtask path.
- `Edge.stream` already exists in the doc schema (`types.ts`) and renders dashed in `WireLayer` - make it semantic, not decorative: an edge is stream-flavored when its source port is a stream port.
- tick built-in: `NodeDefinition` whose instance starts an interval/rAF on first `update`, emits `t` via ctx.emit, stops in `teardown`. pointer built-in: subscribes to a surface's pointer events - needs a small **surface registry** (canvas bodies register their element by node name; pointer nodes reference it via `GraphNode.target`, already in the schema). ENGINE.md "DOM & surfaces" describes the full model: interaction comes from source built-ins referencing a surface _by setting, not by wire_, keeping the graph acyclic.
- Inspectors sample at rAF, never re-render per emit (ENGINE.md performance tactics; the deleted `useLiveTick.ts` pattern was the sketch).

**Watch out**: a 60/s emit into a js-expr node re-runs it per frame - closure state resets. That's why walkers uses the draw-callback design; streams into code nodes are for genuinely per-event logic (brush strokes, emulator input). The docs/demos should teach this distinction.

## 2. Value faces - the `auto` face

**What**: finish ENGINE.md "Legibility mechanisms": _"Bodies show what the node is right now"_. The first half landed (July 2026): raw values cross to React (`values` slice in `core/resultsStore.ts`, `useNodeValue`), `GraphNode.renderMode` (default/table/text/html) rendered by `nodes/ValueFace.tsx`, `GraphNode.valueMode` in the ⚙ popover. Remaining: the **`auto` face** — dispatch on the observed value's type (arrays/objects as lazy inspector trees, images as images, strings as text), face mode `value | hidden`, and eventually DOM/React/graphviz/custom render modes.

**Why second**: PROJECT.md pillar 1 (legibility) and the "every intermediate value is inspectable" promise — and it directly kills the two most user-visible complaints in issues.md: #6 ("footers just say obj {}") and much of #2 (code view; values-first bodies shrink the editor's job). The art browser's fetch node showing a 120-char JSON string is the current ceiling.

**How**: extend `preview()` in `core/resultsStore.ts` beyond capped strings to a shallow tree with lazy expansion; `ValueFace` gains an `auto` mode dispatching on the raw value. Sample at rAF for hot values, never per publish. Do the cheap `preview()` one-liner fix from issues.md #6 immediately even if the tree face comes later.

## 3. Controls built-ins: slider, button + no-code fetch

**What**: PROJECT.md node families table - controls. Each is a few lines on the now-existing contract (`NodeDefinition` + a small React body + `emitValue`; text/state from the natto-parity pass are the templates, `builtins/index.ts` + their bodies). Natto's `StateControl` (number slider / boolean / select / text widgets) is prior art. Also: a no-code **Fetch built-in** (url/method/headers in; response/json/error out; debounce + manual trigger) - ENGINE.md "Platform services".

**Why third**: with streams (item 1) this completes PROJECT.md's success criterion #1: _"slider → sine wave → canvas plot in under two minutes without docs."_ Slider is dual-direction eventually (source of its value AND sink for upstream - the `derives` case, item 7); v0 of it is source-only.

## 4. Node chrome & board polish pass — absorbs issues.md

**What**: one batched pass over the scoped items in **issues.md** (each has file-level scoping there): demos auto-align + fit view on load (#1), the natto-style split-pane code node body — editor over a first-class value region with a draggable divider (#2, the biggest of the batch), dot-grid LOD crossfade on zoom (#3), SVG run/settings icons (#4), header control-group layout — move –/× out of the middle (#5), plus the `preview()` one-liner from #6 if item 2 hasn't landed yet. Also fold in the old export-handle work: `.olabel` truncation (max-width ~110px + ellipsis + `title`) and overflow collapse beyond ~6 exports ("· n more ▾", `portPos` clamp in `graph/geometry.ts`) — now meaningful since js-module made multi-export nodes real. Keep the stacked column; do NOT match handles to code line positions (they'd jump while typing).

**Why here**: individually tiny (~30-40 lines each), collectively they're the difference between "demo" and "product" feel — and they're what a first-time user hits before any engine capability matters. Batching avoids six separate context-loads of the same three files (`NodeCard.tsx`, `Board.tsx`, `CodeNodeBody.tsx`).

## 5. Blueprints - copy/paste as JSON

**What**: PROJECT.md "Blueprints" section: any selection copies as a self-contained JSON envelope (`{ "$schema": "nodular/blueprint@1", meta, nodes, edges, exposedPorts }` - exact shape in ENGINE.md "Platform services > Clipboard"), pastes anywhere with id remap + cursor offset; boundary-crossing edges become dangling exposed ports.

**How**: doc model is already flat id-keyed maps + per-node code strings (deliberately CRDT/clipboard-friendly). Dual-write `text/plain` + `web application/x-nodular+json`. Paste fallthrough: plain text → code node, image → image node, URL → pre-filled fetch node. Selection already exists (`sel` in `graph/store.ts`); needs copy/cut/paste keyboard handlers in `ui/board/useBoardInput.ts` and the envelope (de)serializer next to `persist/file.ts`.

**Why fifth**: small cost on the existing doc model, big shareability payoff — and it's the seed of the whole share/library track (item 9) without any infra.

---

## Parked: the Python track (decide before building)

**Gate**: items 6-7 are a package whose payoff is real Python. Before starting either, answer: _does the product need Python now, or is JS + built-ins carrying every demo we care about?_ If JS is carrying it, both stay parked. The one standalone argument for item 6 is `while(true)` freezing the tab — if that bites before Python does, consider a cheaper interim (accept it, or a coarse "unresponsive node" detector) rather than pulling the whole worker track forward.

## 6. Workers + watchdog

**What**: ENGINE.md stack: "one Web Worker per language, lazy-loaded - isolation, kill-ability, main thread stays responsive". Plus the watchdog: workers hard-terminate on timeout with a visible **"node killed"** state (Execution model bullet 4). Prerequisite for Pyodide — never load a Python runtime on the main thread.

**How**:

- The core doesn't change (Executable is already async + AbortSignal-threaded; ENGINE.md Status deviation #4 notes this was designed for). The **adapter** moves compilation/execution into a worker and proxies `instantiate` over RPC - Comlink is the candidate (ENGINE.md stack).
- Watchdog: per-eval timer on the host side; on expiry, `worker.terminate()`, respawn lazily, publish `{ k: "error", why: "node killed - exceeded …" }`. Kill/respawn lifecycle lives in the adapter, not the engine.
- Decide: main-thread js-expr stays as the fast path (natto-like instant feel) with worker execution opt-in/automatic for long-running nodes, or everything moves. Leaning fast-path-stays.
- DOM-owning nodes (canvas render fns) must stay main-thread until `transferControlToOffscreen` work (ENGINE.md "DOM & surfaces" case 2).

## 7. Pyodide kernel - real Python

**What**: replace the placeholder py adapter (`adapters/py.ts`, regex heuristics from `inference/py.ts`) with a Pyodide worker kernel. First real cross-language edges.

**How** (ENGINE.md "Languages" + stack):

- Worker kernel loading Pyodide lazily on first py-node eval, with inline progress on the node ("Pyodide first load: seconds cold" - performance budget table; service-worker cache after).
- `inferInterface` via `ast.parse` **in-kernel** (top-level defs / `__all__`), replacing the regex; same `InferredInterface` shape, so handles/geometry don't change.
- Inputs injected as a globals dict; result = last expression (Pyodide's `runPython` returns it natively - matches the "→" convention for free).
- **Marshalling**: the `LanguageAdapter.marshal` stubs become real - PyProxy→JS for values, Python functions cross as **async host functions** (`wrapFn`), and the UI must show cross-language calls as async (PROJECT.md pillar 4). The `xlang` edge badge (`types.ts`, rendered in `WireLayer`) becomes semantic.
- The walkers demo can then optionally regain its original py `field` node - the cross-language showcase the mockup staged.

---

## 8. Smaller engine items (opportunistic — bundle into whatever's nearby)

- **Parallel topo layers**: `kahnTopo` (`core/graph.ts`) already computes layer-compatible order; flush groups by layer and `Promise.all`s. Blocked on nothing; matters once fetches/kernels make evals slow.
- **`derives` map**: declared-derivation cycle detection (ENGINE.md Execution model last bullet) so dual-direction built-ins (slider driven from upstream) are legal. Add to `NodeDefinition.iface` when the slider (item 3) goes dual-direction.
- **Debounce knob** for expensive nodes: fetch nodes re-run per keystroke burst (epoch abort keeps it sane; natto behaves the same). A per-node debounce could still help.
- **`setup(host)` for built-ins**: pay down v0 deviation #1 - engine-owned DOM mounting instead of React bodies reading `nodeInputs`. Do it when the first worker-owned surface (OffscreenCanvas) forces the question; not before.
- **esbuild-wasm `transform()`** for TS/JSX per node (ENGINE.md stack: transform-only, never `build()`). **On request only** — no demand signal yet; don't build speculatively.

## 9. Persistence/share track (later, order flexible)

- Cloud save: local-first stays (IndexedDB via `persist/autosave.ts` is source of truth); Supabase sync + share links per ENGINE.md "Platform services > Cloud save".
- Read-only share viewer (v1 static snapshot - no realtime infra), then Yjs phases per PROJECT.md non-goals timeline.
- Strict mode / capability plumbing (network per-origin allowlist, QuickJS for shared graphs) - ENGINE.md "Security"; build the capability seams before collab, as the spec insists.

---

## Standing constraints (apply to every item)

- The core never branches on language or node kind - new capability = new registration (`core/registry.ts`). If an item seems to need a core `if (lang === …)`, the design is wrong.
- Engine state stays outside React; React reads via per-id store hooks. Engine ticks must never re-render chrome (memoized `NodeCard`).
- Verification: `npm run build` + `npm run lint` in `app/` must stay clean; the user tests the running app manually - no browser automation.
- Update ENGINE.md's **Status** section (and strike items here) as each lands.
