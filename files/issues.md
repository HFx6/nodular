# issues - UX / polish queue

Scoped against the code (July 2026). Each item says where it lands and roughly how. These are all small; batch them as a node-chrome/board polish pass (NEXT #4).

## 1. Demos should auto-align on open

Loading an example keeps its hand-authored layout; it should land tidied and centered instead.

- **Where**: `App.tsx` `onLoadExample` → `loadDoc` (calls `store.setDoc`); the aligner already exists — `tidy()` in `graph/store.ts` wraps `layeredLayout` (shift+L today).
- **How**: after `setDoc`, run `tidy()` and reset/fit the view. Catch: `layeredLayout` reads measured heights from `sizeStore`, which only fill in after first render — so either call `tidy()` in a double `requestAnimationFrame` after the doc lands (accurate), or accept the `estimateHeight` fallback the layout already has (instant, close enough for the demos). Then fit the view to the layout bounds.
- Applies to example loads only — file open / autosave restore must keep the user's saved positions.

## 2. Code node body: redesign as a natto-style split pane

The current body (`nodes/CodeNodeBody.tsx`) is editor + a thin 27px result strip bolted underneath, with hand-tuned pixel math (`editorH`: header 30 / strip 27 / padding 16, 45% split when a face is set). It reads as an afterthought. Natto's pane anatomy is the model: **the body is a vertical split — code editor on top, a full value area below, draggable divider between them.** The value area is a first-class region, not a footer.

- **How**:
  - Restructure `CodeNodeBody` as a flex column: editor region + divider + value region; the divider drags to set the split (store per node, e.g. `GraphNode.split` 0..1, default ~0.5), replacing all computed pixel heights. Either region collapses to a slim bar when dragged to an extreme (natto lets you hide the code entirely — a value-only pane).
  - The value region IS `ValueFace` (`nodes/ValueFace.tsx`) — always present, rendering per `renderMode` (default preview / table / text / html, later the `auto` face from NEXT #2). Errors render there too (red, full message with room to wrap) instead of an ellipsized one-liner. The separate `showStrip` / `face` branches collapse into one region.
  - Editor polish in the same pass: wheel over the editor scrolls the code, never zooms the board; CM theme (font size, no gutters, selection colors) aligned with `theme.ts`.
- **Payoff**: values become visible by default at a useful size (the legibility pillar), and issue #6 gets real estate to render into instead of a 27px strip.

## 3. Dot grid looks bad zoomed out

`ui/board/Board.tsx` background: a single `radial-gradient` dot layer scaled by `view.k` — zoomed out the dots alias into noise.

- **How**: level-of-detail crossfade with two background layers. Fine dots (every GRID) fade out as `view.k` drops below ~0.7; a coarse layer (every 4×GRID, slightly darker `C.dot`) fades in, so the grid "remakes" itself at the larger period. Both are computed rgba colors keyed off `view.k` — no extra DOM, just a second entry in `backgroundImage`/`backgroundSize`/`backgroundPosition`. Clamp so at k=1 it looks exactly like today.

## 4. Play and settings icons look bad

`nodes/NodeCard.tsx` header uses text glyphs `▷` (run) and `⚙` (settings) — inconsistent weight/baseline across fonts.

- **How**: replace with 12px inline SVGs (stroke `C.dim`, hover `C.ink`), same style as the existing resize-grip SVG at the bottom of `NodeCard.tsx`. Two tiny components; the `.ctrl` class keeps hit area and hover behavior.

## 5. Minimize / delete buttons are in the wrong place

`nodes/NodeCard.tsx` header order is: title · mode · ▷ · ⚙ · **–** · **×** · →. The destructive/window controls sit mid-group, before the value port.

- **How**: decide the header grammar first, then move them. Proposal: left = identity (title, lang), middle-right = per-node actions (mode, ▷, ⚙), far right stays the → value port (it's a port, not a button — it must stay on the edge for wire anchoring), and – / × move to the far LEFT of the control group with extra separation, or become hover-revealed. Pure JSX reorder in one file; no geometry impact (→ anchor position unchanged).

## 6. Node footers say "obj {}" — show something useful

The result strip (`nodes/CodeNodeBody.tsx` `showStrip`) prints `res.v`, the capped preview string from `preview()` in `engine/core/resultsStore.ts`, which collapses objects to near-nothing.

- **How, near term**: make `preview()` produce a real one-liner — arrays as `[n] first, second, …`, objects as `{ key: v, key2: v2, … } · n keys`, strings quoted + truncated, numbers/booleans as-is. ~20 lines in `resultsStore.ts`, instantly better everywhere the strip renders.
- **Real fix**: the `auto` value face (NEXT #2) — the footer becomes a type-dispatched face (inspector tree for objects/arrays, image for images, text for strings) and the strip remains only as the error/kind line.
