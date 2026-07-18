# REF - nodular

Research notes: prior art, libraries, and design inspiration. Nothing here is a decision; decisions live in PROJECT.md and ENGINE.md. Researched July 2026.

---

## A. Prior art (products doing our thing or adjacent)

### natto.dev - https://natto.dev

JavaScript panes on a 2D canvas; values flow between panes via wires. Closest existing product to our dataflow mode.

- How it works (Paul Shen published the eval pseudocode: gist.github.com/paulshen/9889b6067609f9053a0d56d464164cad): each pane is `new Function('inputs', expression)`, memoized on the expression; re-evaluation is driven by input-atom subscriptions, so React state is the scheduler. No bundler, no module system, no topo sort. CodeMirror for editing. Canvases are plain JSON `.natto` files (local-first optional) or OT-synced server canvases. Signature interaction: drag a column header out of a table pane to spawn a derived pane.
- Relevant to us: the three-line-eval cheapness (adopted as our js-expr adapter); JSON-file canvases; liveness-first feel. Its React-as-scheduler design rules out async orchestration, cancellation, workers, and other languages, which is the ceiling our engine exists to break. JS-only, expression-scoped, effectively frozen.

### nodes.io (Variable) - https://nodes.io/story/

Node-based creative-coding environment where nodes are real JavaScript modules leveraging npm. Closest to our module mode. The /story page is a design-decision goldmine.

- How it works: nodes are JS compiled instantly on edit; graphs run multiple branches simultaneously (2D d3 + raw WebGL + PBR 3D from the same data); nodes copy-paste between graphs and windows as plain JSON, even through Slack or email; node comments render values, images, and mini-charts on the node face; one-click export bundles code + graph + assets for static hosting or Electron.
- Relevant to us: JSON-clipboard subgraph sharing (our blueprints); multi-branch live execution; on-node value annotation; export-to-static-site. Never launched publicly; JS-only; bespoke pre-ES-modules compile pipeline.

### Observable - https://observablehq.com (runtime: github.com/observablehq/runtime)

Reactive JS notebooks. Not node-based, but the reactive evaluation semantics match our engine, battle-tested at scale.

- How it works: cells form a dependency graph by name reference; topological evaluation; editing a cell re-runs only dependents; circular definitions rejected; an `invalidation` promise handles teardown of loops/listeners (same idea as our AbortSignal); lazy evaluation of unobserved variables; import-with lets you override cells of an imported notebook. Runtime, parser, stdlib, and inspector are open source (ISC); the editor is proprietary.
- Relevant to us: read `observablehq/runtime` before finalizing our engine - variables/modules/observers, laziness, invalidation. It lacks stream semantics and cross-worker nodes, so we write our own but mirror its shapes. Also useful: `htl` (safe HTML templating) and `inputs` (well-designed widgets, reference for our built-ins). Cautionary: they forked JS syntax (viewof, mutable) - our edges-carry-bindings approach avoids a dialect; their proprietary format caused git-hostility - our JSON must stay diffable.

### cables.gl - https://cables.gl

Browser node tool for real-time WebGL/VFX (undev, Berlin). Free.

- How it works: large library of prebuilt ops patched together; timeline animation; patches publishable and remixable; export-to-webpage; custom shader/JS ops as the escape hatch.
- Relevant to us: documentation pattern (every node type links to public patches using it); export story; port-type discipline for GL resources. Differs: ops-first rather than code-first; graphics-only domain.

### Flyde - https://flyde.dev

Open-source visual flows for backend TS logic inside VS Code; nodes can be code imported from local project files; flows are files in git, executed via a runtime lib. AGPL editor.

- Relevant to us: flows-as-committed-files (graph JSON in git, diffable); code-nodes-from-real-modules; their framing that visual shines for high-level glue. Differs: backend/Node, VS Code-hosted, not a live canvas. AGPL - don't vendor editor code.

### ComfyUI - github.com/Comfy-Org/ComfyUI_frontend

The most-used node graph UI today (AI image workflows). Its graph layer was litegraph.js, merged into the frontend monorepo; the standalone repo archived Aug 2025.

- Relevant to us: UX conventions its user base normalized - search-box node insertion, subgraphs, reroute/group nodes, JSON workflow sharing as culture; Canvas2D performance at hundreds of nodes. Differs: execution on a remote Python server; nodes are parameter forms, not code.

### Shorter mentions

- tldraw - canvas feel benchmark (cursor physics, selection, zoom); SDK is an alternative substrate if ReactFlow ever chafes.
- val.town - small live code units referencing each other + instant sharing; reference for social/permalink model.
- JupyterLite - proves lazy-loaded, service-worker-cached Pyodide kernels at scale.
- marimo - reactive notebook for Python; same engine idea, different UI.
- VVVV / TouchDesigner / Max/MSP / Pure Data / Unreal Blueprints - desktop lineage. Typed ports (TD), sub-patching (Max), delay-edge feedback semantics (PD - our future cycle answer).

## B. Graph UI & engine libraries

| Library                                            | What                                                                      | Notes                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Flow (xyflow) - reactflow.dev                | React node canvas: pan/zoom, edges, minimap, custom nodes as components   | Evaluated and passed over - bespoke canvas decided instead (see ENGINE.md stack rationale). Still the reference for what box-select/minimap owe us |
| Rete.js v2 - retejs.org                            | TS framework: editor renderers + dataflow/control-flow processing engines | Read rete-engine's dataflow processor as a small clean reference before finalizing ours                                                            |
| litegraph.js - archived, lives in ComfyUI_frontend | Canvas2D graph engine + editor, JSON graph export                         | Reference for rendering perf at scale and its "live mode" (hide graph, nodes render their UIs)                                                     |
| Observable runtime                                 | Reactive variable/module/observer engine (ISC)                            | Primary engine reference (section A)                                                                                                               |
| Drawflow / Baklava.js / Flume                      | Lighter node editors                                                      | Skim only                                                                                                                                          |

## C. Language runtimes

| Runtime                                | Language                                                              | Notes                                                                                                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pyodide - pyodide.org                  | CPython → WASM                                                        | micropip installs pure-Python wheels; numpy/pandas/scipy/matplotlib ported; strong JS FFI incl. async/await; Python gets full Web API access. Worker + service-worker cache                                |
| ruby.wasm                              | CRuby → WASM (official)                                               | Decent JS bridge; Prism parser available in-runtime for export inference                                                                                                                                   |
| wasmoon                                | Lua 5.4 → WASM                                                        | Smallest/fastest kernel; env-table injection trivial                                                                                                                                                       |
| quickjs-emscripten                     | Sandboxed JS                                                          | Strict mode for shared graphs; cleanest way to hard-limit memory/time on JS                                                                                                                                |
| @tani/polyglot - jsr.io/@tani/polyglot | Unified adapter over QuickJS, Pyodide, ruby.wasm, wasmoon, BiwaScheme | Independently converged on our adapter shape, including type marshalling. Gap: no C/C++/C# (interpreted/managed runtimes only) - our wasm adapter covers that. Possibly usable directly for tier-2 kernels |
| Emscripten / wasm-bindgen artifacts    | C/C++/Rust → .wasm                                                    | v1 path: user uploads compiled module; exports section gives free port inference                                                                                                                           |
| dotnet-wasm                            | C#                                                                    | Works; very heavy download; backlog                                                                                                                                                                        |
| v86-style x86→WASM                     | Anything                                                              | Exists; far too heavyweight per node                                                                                                                                                                       |

## D. Module loading & transforms

| Tool                       | Role                                    | Notes                                                                                                                                                                                                                                                                    |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| esbuild-wasm               | Per-node transform() (TS/JSX strip)     | Actively maintained. transform is the robust subset; in-browser build() requires custom CDN resolve/load plugins (no fs, no npm) - the fragility we left behind. bundlejs.com's writeup documents that plugin stack if ever needed                                       |
| es-module-lexer            | Fast import/export scan                 | Powers live handle inference                                                                                                                                                                                                                                             |
| esm.sh / jsdelivr +esm     | npm → ES modules CDN                    | Import-map target; esm.sh pre-bundles package deps                                                                                                                                                                                                                       |
| import maps + Blob URLs    | The "bundler"                           | Native browser machinery                                                                                                                                                                                                                                                 |
| Sandpack (CodeSandbox)     | In-browser bundler component            | Only if we ever want full npm-project nodes                                                                                                                                                                                                                              |
| WebContainers (StackBlitz) | Full Node.js in browser                 | The ceiling; proprietary licensing for commercial use; not needed for our architecture                                                                                                                                                                                   |
| CodeMirror 6               | Per-pane editing                        | Multi-instance-friendly, plain-CSS themes, <100ms init, Lezer grammars for all languages, LSP via community packages. Chosen over Monaco (global reference model resists many instances, inline-only styling, 2–5MB). natto, Observable, Replit, Firefox DevTools use it |
| Comlink                    | Worker RPC (proxies, transfer handlers) | Candidate for kernel protocol over hand-rolled postMessage                                                                                                                                                                                                               |

## E. Design inspiration (research only - no standards chosen)

Grouped by aesthetic family. Worth browsing as screenshots/video; none of this is adopted.

**Calm/paper**: natto.dev (panes on near-white, hairline borders, code as the hero); Origami Studio (Meta - most polished in this family, praised for patch legibility and quiet color); tldraw (canvas feel benchmark, not node-based).

**Pro dark-graph (3D/VFX lineage)**: Blender Geometry Nodes (widely liked node redesign; category-colored headers; themes are XML so community reskins like Dark Pro show the same graph under many palettes - useful for stress-testing any future token system); Houdini (power-user benchmark: wire-shape options, badges); Substance 3D Designer (thumbnail-on-node is its signature legibility feature - directly relevant to our on-node value previews).

**Instrument (music tools)**: Bitwig Studio's The Grid (arguably the most refined node UI shipping: modules on deep slate, distinct port dots, animated signal flow; watch video, the motion is the point - strongest reference for making stream ports feel alive without glow-spaghetti); Max/MSP + RNBO (austere ancestor; patching conventions, and a warning about visual flatness).

**Creative web**: cables.gl (dense but coherent dark patcher; liked op-search UX); tooll3/T3 (open-source motion graphics; animated curves on wires); Notch, TouchDesigner (operator viewers - every node can display its live output - proven at scale; our "node comments render values" idea validated).

**Modern SaaS workflow**: n8n (most mainstream-liked node canvas currently; clean themes, big legible icons, strong empty states); Rive's state machine editor (design-tool-company polish; steal micro-interactions frame by frame: port hover, connection snapping); Rivet (Ironclad); Unreal Blueprints (most-used node editor on earth - reroute nodes, comment boxes, exec-vs-data pin distinction worth study regardless of aesthetic).

**Oddballs**: Enso (formerly Luna) - visual-textual hybrid where every node shows its value inline; philosophically closest to nodular though the product stalled. NodeBox - minimal grey-on-grey graph aesthetic that aged well.

Suggested browsing order for nodular: Bitwig Grid (emotional target), Substance/TouchDesigner (value-previews-on-nodes), Blender + theme mods (systematic design language surviving reskins), Origami/Rive (micro-interactions), n8n (approachability benchmark).

## F. Reading list

1. nodes.io/story - every paragraph is a design decision we'll face.
2. observablehq/runtime README + source - engine semantics: variables, laziness, invalidation.
3. bundlejs writeup (hackernoon, "Bundlejs: an online esbuild-based bundler") - documented tour of why in-browser bundling is fragile: CDN resolver plugins, multi-GB memory blowups, CSP hardening.
4. natto.dev/tutorial + Paul Shen's eval-pseudocode gist - the liveness bar, and how little machinery it took.
5. Rete.js docs, Processing section - dataflow vs control-flow engines compared.
6. Pyodide docs: type translations + loading packages - the FFI rules our py↔js edges must surface.
