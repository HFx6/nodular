# NEXT - nodular roadmap after engine v0

Ordered work queue. Written to be self-contained for future sessions: each item says what it is, why it's next, where it lands in the code, and what it unblocks. Specs referenced: PROJECT.md (product), ENGINE.md (technical - see its **Status** section for exactly what v0 implemented and the four recorded deviations), REF.md (research), issues.md (small UX items).

Baseline (July 2026, engine v0 shipped): language-agnostic core in `app/src/engine/core/` (dirty propagation, downstream closure + Kahn topo flush, epochs, per-eval AbortController, value ports only), js-expr adapter (`app/src/engine/adapters/js.ts`, AsyncFunction + acorn last-expression splice, wired inputs as named params, lifecycle-wrapped fetch), py as a static-heuristic adapter, table/image/canvas built-ins (`app/src/engine/builtins/`, React bodies), results via a vanilla zustand store (`core/resultsStore.ts`). Walkers and the art browser demos run for real.

---

## 1. js-module adapter - blob-URL ES modules ✅ DONE (July 2026)

**Landed**: module code compiles to a blob-URL ES module and is `import()`ed (`adapters/js.ts moduleExecutable`); wired inputs are injected as top-level bindings via a `globalThis.__nodularInputs` handshake (edges are the imports); bare npm specifiers are rewritten to `https://esm.sh/…` in place (reusing es-module-lexer ranges). Named-export value delivery lives in a generic `portValue(value, port)` in `core/engine.ts` (the only core change), which also unwraps `export default` for "→" via `Symbol.toStringTag === "Module"`. `isModule` now counts only static imports (`d === -1`), so `await import(...)` stays on the expr path. Also shipped the **import built-in** (`UiKind "import"`, `importDef`, `ImportNodeBody`, `GraphNode.useDefault`, `addNode(at, "import")`, "+ import" TopBar button). Original spec below for reference.

**What**: real instantiation for JS code containing `import`/`export`. Today the js adapter's module branch returns a `StaticResult` ("module - exports carry the value") and named-export edges deliver `undefined` (v0 deviation #3 in ENGINE.md Status). This is the biggest capability gap: it's the difference between "expressions run" and "real modules run".

**Why first**: multi-export nodes are currently decorative - the walkers-style `export function draw()` pattern, npm imports, and every named-export wire depend on this. Issue #1's export-handle work (item 7 below) also assumes exports that mean something.

**How** (per ENGINE.md "Omni engine" + "Legibility mechanisms"):
- Generate an invisible **import prelude** from the node's in-edges: wired inputs are injected bindings, never user-written imports ("edges are the imports"). Practical shape: a registry module (or `globalThis` handshake keyed by node id + epoch) the prelude reads from, since blob modules can't close over values.
- Compile the user code + prelude to a `Blob` URL, `import()` it. Named exports become the port values; `export default` feeds the "→" result port (ENGINE.md "Default output").
- Re-instantiate on code change or input change (blob URL churn is the accepted cost vs js-expr; ENGINE.md records the two-adapter split for exactly this reason). Revoke old URLs.
- npm: **decided — rewrite bare specifiers to `https://esm.sh/<spec>` in place** during prelude generation, reusing the es-module-lexer parse (specifier ranges come free). No import map, no es-module-shims: import maps are static per document and the shim is a heavy dependency, while rewriting is a few lines on machinery we already run. URL specifiers pass through; relative specifiers (`./x`) are meaningless in a blob and surface the browser's resolution error on the node.
- Engine seam: none. The adapter's `instantiate` returns an `Executable` whose resolved value is the exports record; the core needs one addition - **named-port value delivery** in `gatherInputs` (`core/engine.ts`): when `e.from[1] !== "→"`, read the export of that name off the upstream value instead of returning undefined. Keep this tiny and generic (a `portValue(value, portName)` helper) so Python defs later flow through the same path.
- Top-level state: module-scope `let` persists across downstream re-evals but resets on re-instantiation - matches ENGINE.md "real live bindings" intent for v1; document the reset behavior.

**Watch out**: es-module-lexer is already used for classification (`adapters/js.ts isModule`) and export inference (`inference/js.ts`) - reuse, don't re-parse. `wireGeometry`'s broken-edge check (`graph/geometry.ts`) already validates named exports against `outsFor`; it starts being load-bearing for real values.

**Natto prior art (verified July 2026 against the open-sourced evaluator, github.com/paulshen/natto-lib, `packages/eval/src/evaluator.ts`)**:
- Natto panes are expressions via `AsyncFunction(...globals, ...inputNames, "return (expr)")` — module syntax is never supported. Its evaluator auto-awaits promise results, shows "running" if unsettled after one microtask, and discards stale runs with a `runId` counter. Our engine (epochs, async Executable, injected params) is already the superset; nothing there conflicts, and natto has no cancellation at all.
- Natto's library feature is a dedicated **Import pane type**, not import syntax: `["npm", name]` → dynamic `import("https://cdn.skypack.dev/" + name)`, output = `useDefault ? module.default : module` (a per-pane toggle), plus a `<script>`-tag mode for non-ESM libs. The loaded module is then *a value on a wire*.
- **CDN**: skypack.dev is unmaintained (~2022, fails on newer packages). We use **esm.sh** — same npm→ESM trick, actively maintained, CJS converted on the fly, versions/subpaths supported (`uuid@9`, `lodash/debounce`). esm.sh builds *any* npm package on demand (verified July 2026: plain/scoped/versioned/subpath/new packages all 200 — `uuid`, `@tanstack/store`, `zod@4`, `lodash-es/debounce`, `hono`, `es-toolkit`; skypack 404s on `zod@4` and `es-toolkit`). Only packages needing Node built-ins (`fs`, `net`) can't run — true of any browser CDN. It's a URL prefix, not a dependency; jsDelivr `+esm` is a one-string-swap fallback. The `<script>` mode is dropped (existed for CJS-only libs esm.sh now handles; script tags leak globals with no teardown).
- **Bug this surfaced**: `isModule` counted es-module-lexer's `imports` array, which *includes dynamic `import()` calls* — so a natto-style `await import("https://esm.sh/x")` expression was wrongly routed to the static module placeholder when the AsyncFunction expr path handles it natively. Classifier now only counts static imports (`d === -1`) and exports.
- **Import built-in** adopted alongside this item: `UiKind "import"` + `importDef` (pure source, `ins: []`) + `ImportNodeBody` (package name or URL in `n.code`, `GraphNode.useDefault` toggle, debounced load, emits via `emitValue`), created via `addNode(at, "import")` and the "+ import" TopBar button.

## 2. Streams - the second port semantics

**What**: ENGINE.md "Execution model": stream ports are ephemeral events/frames that **coalesce to latest per port and flush once per animation frame** (backpressure), with a per-edge opt-out for every-sample consumers. v0 implemented value semantics only; `PortSemantics` in `core/types.ts` already declares `"value" | "stream"` for this.

**Why second**: unlocks tick and pointer as real source built-ins (their bodies in `nodes/SourceNodeBody.tsx` are placeholders saying "coming with the stream phase"), and pays down v0 deviation #2 - the canvas currently hands its renderer `frame = { t, dt, width, height, cursor }` because there was no other way to move per-frame data. With streams, tick/pointer become nodes again and the frame record slims down.

**How**:
- Scheduler: `emitValue` (`core/engine.ts`) grows a stream path - instead of dirtying downstream immediately, buffer latest-per-port and flush the batch on `requestAnimationFrame`. Value emits keep the current microtask path.
- `Edge.stream` already exists in the doc schema (`types.ts`) and renders dashed in `WireLayer` - make it semantic, not decorative: an edge is stream-flavored when its source port is a stream port.
- tick built-in: `NodeDefinition` whose instance starts an interval/rAF on first `update`, emits `t` via ctx.emit, stops in `teardown`. pointer built-in: subscribes to a surface's pointer events - needs a small **surface registry** (canvas bodies register their element by node name; pointer nodes reference it via `GraphNode.target`, already in the schema). ENGINE.md "DOM & surfaces" describes the full model: interaction comes from source built-ins referencing a surface *by setting, not by wire*, keeping the graph acyclic.
- Inspectors sample at rAF, never re-render per emit (ENGINE.md performance tactics; the deleted `useLiveTick.ts` pattern was the sketch).

**Watch out**: a 60/s emit into a js-expr node re-runs it per frame - closure state resets. That's why walkers uses the draw-callback design; streams into code nodes are for genuinely per-event logic (brush strokes, emulator input). The docs/demos should teach this distinction.

## 3. Workers + watchdog

**What**: ENGINE.md stack: "one Web Worker per language, lazy-loaded - isolation, kill-ability, main thread stays responsive". Plus the watchdog: workers hard-terminate on timeout with a visible **"node killed"** state (Execution model bullet 4).

**Why here**: prerequisite for Pyodide (item 4) - never load a Python runtime on the main thread. Also the answer to `while(true)` in a JS node, which today freezes the tab (main-thread AsyncFunction can't be preempted; only awaits can be aborted).

**How**:
- The core doesn't change (Executable is already async + AbortSignal-threaded; ENGINE.md Status deviation #4 notes this was designed for). The **adapter** moves compilation/execution into a worker and proxies `instantiate` over RPC - Comlink is the candidate (ENGINE.md stack, media interchange row).
- Watchdog: per-eval timer on the host side; on expiry, `worker.terminate()`, respawn lazily, publish `{ k: "error", why: "node killed - exceeded …" }`. Needs a kill/respawn lifecycle in the adapter, not the engine.
- Decide: main-thread js-expr stays as the fast path (natto-like instant feel) with worker execution opt-in/automatic for long-running nodes, or everything moves. ENGINE.md open question adjacent; leaning fast-path-stays.
- DOM-owning nodes (canvas render fns) must stay main-thread until `transferControlToOffscreen` work (ENGINE.md "DOM & surfaces" case 2).

## 4. Pyodide kernel - real Python

**What**: replace the placeholder py adapter (`adapters/py.ts`, regex heuristics from `inference/py.ts`) with a Pyodide worker kernel. First real cross-language edges.

**How** (ENGINE.md "Languages" + stack):
- Worker kernel loading Pyodide lazily on first py-node eval, with inline progress on the node ("Pyodide first load: seconds cold" - performance budget table; service-worker cache after).
- `inferInterface` via `ast.parse` **in-kernel** (top-level defs / `__all__`), replacing the regex; same `InferredInterface` shape, so handles/geometry don't change.
- Inputs injected as a globals dict; result = last expression (Pyodide's `runPython` returns it natively - matches the "→" convention for free).
- **Marshalling**: this is where the `LanguageAdapter.marshal` stubs (declared in ENGINE.md's interface, noted as future in `core/types.ts`) become real - PyProxy→JS for values, Python functions cross as **async host functions** (`wrapFn`), and the UI must show cross-language calls as async (PROJECT.md pillar 4). The `xlang` edge badge (`types.ts`, rendered in `WireLayer`) becomes semantic.
- The walkers demo can then optionally regain its original py `field` node - the cross-language showcase the mockup staged.

## 5. Smaller engine items (bundle opportunistically)

- **Parallel topo layers**: `kahnTopo` (`core/graph.ts`) already computes layer-compatible order; flush groups by layer and `Promise.all`s. Blocked on nothing; matters once fetches/kernels make evals slow.
- **`derives` map**: declared-derivation cycle detection (ENGINE.md Execution model last bullet) so dual-direction built-ins (slider driven from upstream) are legal. Add to `NodeDefinition.iface` when the first such built-in lands.
- **esbuild-wasm `transform()`** in a worker for TS/JSX per node (ENGINE.md stack: transform-only, never `build()`). Slots into the js adapter's compile path behind a debounced pass.
- **Debounce knob** for expensive nodes: fetch nodes currently re-run per keystroke burst (epoch abort keeps it sane; natto behaves the same). A per-node debounce could still help. ~~The `manual` run mode wired into the engine~~ **done (July 2026)**: `manual` is a propagation barrier (natto's `autorun: false`), ▷ calls `runNode(id)` which forces one eval — the fix for "can't regenerate the nanoid node".
- **`setup(host)` for built-ins**: pay down v0 deviation #1 - engine-owned DOM mounting instead of React bodies reading `nodeInputs`. Do it when the first worker-owned surface (OffscreenCanvas) forces the question; not before.

---

## Product track (independent of engine order - interleave freely)

## 6. Value faces - bodies render values

**Partially landed (July 2026, natto-parity pass)**: raw values now cross to React (`values` slice in `core/resultsStore.ts`, `publishValue`/`useNodeValue`), and code nodes have a **render output** setting (`GraphNode.renderMode`: default/table/text/html, natto's `renderOutput`) rendered by `nodes/ValueFace.tsx` below the editor — the ⚙ popover (`nodes/NodeSettings.tsx`) sets it, alongside **editor value mode** (`GraphNode.valueMode`: auto/expr/body/text, natto's `expressionType`). Remaining: the `auto` face (dispatch on observed type, inspector trees), face mode `value | hidden`, DOM/React/graphviz/custom render modes.

**What**: ENGINE.md "Legibility mechanisms": *"Bodies show what the node is right now"* - arrays/objects as inspector trees, images as images, strings as text; code moves to a peek + the side rail. The conditional result strip built in v0 (`nodes/CodeNodeBody.tsx`) is the seed; `face mode: auto | value | hidden` is the spec'd header setting.

**Why**: PROJECT.md pillar 1 (legibility) and the "every intermediate value is inspectable" promise. The art browser's fetch node showing a 120-char JSON string is the current ceiling.

**How**: a `ValueFace` component dispatching on the raw value (which means the results store starts carrying raw values or a richer preview tree, not just capped strings - extend `preview()` in `core/resultsStore.ts` to a shallow tree with lazy expansion). Sample at rAF for hot values, never per publish.

## 7. Export-handle truncation + overflow collapse (issues.md #1)

**What**: `.olabel` handles (`nodes/NodeCard.tsx`, `ui/GlobalStyles.tsx`): max-width ~110px + ellipsis + full name in `title`; beyond ~6 exports, first 5 + a "· n more ▾" toggle. Wires to hidden handles anchor to the collapse row (small `portPos` clamp in `graph/geometry.ts` - outputs are name→index positioned). Keep the stacked column; do NOT match handles to code line positions (they'd jump while typing). ~40 lines. Scoped in issues.md; becomes meaningful once js-module (item 1) makes multi-export nodes real.

## 8. More built-ins: slider, button, text input

**Partially landed (July 2026, natto-parity pass)**: **text** (editor value is the value) and **state** (value on "→", stable setter on `set` — functional updates supported, per-port emit in the core prevents the set-echo loop; the ports-record `PORTS` shape in `core/types.ts` is the generic multi-output mechanism) shipped, plus the config-driven add-node palette (`graph/spawn.ts` + TopBar split button). Natto's `StateControl` (number slider / boolean / select / text widgets on the state pane) is prior art for the controls below.

**What**: PROJECT.md node families table - controls. Each is a few lines on the now-existing contract (`NodeDefinition` + a small React body + `emitValue`; the table built-in is the template, `builtins/index.ts` + `nodes/TableNodeBody.tsx`).

**Why**: with streams (item 2) this completes PROJECT.md's success criterion #1: *"slider → sine wave → canvas plot in under two minutes without docs."* Slider is dual-direction eventually (source of its value AND sink for upstream - the `derives` case); v0 of it can be source-only.

**Also**: a no-code **Fetch built-in** (url/method/headers in; response/json/error out; debounce + manual trigger) - ENGINE.md "Platform services".

## 9. Blueprints - copy/paste as JSON

**What**: PROJECT.md "Blueprints" section: any selection copies as a self-contained JSON envelope (`{ "$schema": "nodular/blueprint@1", meta, nodes, edges, exposedPorts }` - exact shape in ENGINE.md "Platform services > Clipboard"), pastes anywhere with id remap + cursor offset; boundary-crossing edges become dangling exposed ports.

**How**: doc model is already flat id-keyed maps + per-node code strings (deliberately CRDT/clipboard-friendly). Dual-write `text/plain` + `web application/x-nodular+json`. Paste fallthrough: plain text → code node, image → image node, URL → pre-filled fetch node. Selection already exists (`sel` in `graph/store.ts`); needs copy/cut/paste keyboard handlers in `ui/board/useBoardInput.ts` and the envelope (de)serializer next to `persist/file.ts`.

## 10. Persistence/share track (later, order flexible)

- Cloud save: local-first stays (IndexedDB via `persist/autosave.ts` is source of truth); Supabase sync + share links per ENGINE.md "Platform services > Cloud save".
- Read-only share viewer (v1 static snapshot - no realtime infra), then Yjs phases per PROJECT.md non-goals timeline.
- Strict mode / capability plumbing (network per-origin allowlist, QuickJS for shared graphs) - ENGINE.md "Security"; build the capability seams before collab, as the spec insists.

---

## Standing constraints (apply to every item)

- The core never branches on language or node kind - new capability = new registration (`core/registry.ts`). If an item seems to need a core `if (lang === …)`, the design is wrong.
- Engine state stays outside React; React reads via per-id store hooks. Engine ticks must never re-render chrome (memoized `NodeCard`).
- Verification: `npm run build` + `npm run lint` in `app/` must stay clean; the user tests the running app manually - no browser automation.
- Update ENGINE.md's **Status** section (and strike items here) as each lands.
