# Issues — all resolved

Every issue from this list has been implemented. Summary of what landed (see git log for details):

- **#1 node types vs render modes** — split documented in `spawn.ts`/`NodeSettings.tsx`; dedicated UI kinds only for interaction semantics, views extend `RenderMode`. Palette entry renamed "table node (row picker)".
- **#2 edge hover** — hit path widened 18→24px, round caps, un-hover debounced 100ms per edge.
- **#3 labels above + focus dim** — wire badges moved to `WireLabels`, painted after the node cards; hovering an edge 3s dims everything except the two connected nodes.
- **#4 port label contrast** — dedicated `C.portLabel` (darker than wires) + paper background chips on in/out labels.
- **#5 edge status effects** — wires flash green (`C.run`) when a fresh value crosses; smooth stroke transitions; broken stays red-dashed.
- **#6 scroll trap + folding** — board wheel only yields to a code pane when focus is inside it; in-node panes open with 8+ line top-level blocks folded to a clickable `…`.
- **#7 double-click opens editor** — dblclick a code node's header selects it and opens the rail.
- **#8 syntax highlighting** — full muted tag set: comments (italic), function/property/type names, bools, regexps; operators/punctuation quiet.
- **#9 prettier + linting** — `fmt` button in the rail (prettier standalone, lazy-loaded chunk); js syntax diagnostics via `@codemirror/lint` + acorn.
- **#10 in/out value visuals** — live value chips beside input labels, fed by the same per-id results subscriptions.
- **#11 canvas aspect ratio** — `aspect` node property + presets in ⚙ settings (1:1, 4:3, 3:2, 256:240 NES native, 16:9); NES example set to native.
- **#12 examples** — `src/examples/index.ts` manifest with lazy imports (NES leaves the main bundle); `.nodular.json` drop-ins auto-appear in the menu.
- **#12b drag-release on buttons** — 4px drag slop + capture-phase click suppression; drags pause history so a whole drag is one undo entry.
- **#13 header placement** — name left; run/mode then ⚙ – × right, secondary controls hover-revealed; delete no longer the first item.
- **#14 cursor during drag** — pointer capture on the board once a drag starts + a global `grabbing`/`nwse-resize` cursor override for the whole gesture.
- **#15 drag latency** — pointermoves coalesced to one store write per frame; per-wire memoization + route cache.
- **#16 animations** — eased 250ms tween for fitView/zoom-reset; spawn pop-in, popover fade, rail slide (all under `prefers-reduced-motion`).
- **#17 rail resize** — left-edge drag handle, 240px–70vw clamp, width persisted to localStorage, double-click resets.
- **#18 click-to-place** — palette arms a placement mode with a grid-snapped ghost; click places, esc/right-click cancels.
- **#19 gutter background** — `.cm-gutters` opaque (`C.pane`) so scrolled code no longer bleeds through the line numbers.
