// Level-of-detail signal: a single boolean, true when the board is zoomed out
// far enough that real node bodies (CodeMirror editors, tables) are illegible
// and should be swapped for cheap minimap-style skeletons. Mirrors sizeStore:
// a vanilla zustand store written from the view transform, read by nodes.
//
// The flip must be cheap and rare — it re-renders every DOM-heavy card — so it
// carries hysteresis: enter LOD below LOD_ENTER, leave only back above LOD_EXIT.
// A wheel hovering at the threshold can't thrash the swap.

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

const LOD_ENTER = 0.5;
const LOD_EXIT = 0.55;

interface LodState {
  lod: boolean;
}

export const lodStore = createStore<LodState>()(() => ({ lod: false }));

/** Live zoom for non-React readers (canvas backing-store sizing). Plain mutable
 *  object, no subscribers — read per animation frame. */
export const zoomNow = { k: 1 };

/** Feed from the view transform on every change. setState fires only when the
 *  boolean actually flips, so subscribed cards re-render twice per zoom cycle. */
export function publishZoom(k: number): void {
  zoomNow.k = k;
  const cur = lodStore.getState().lod;
  if (!cur && k < LOD_ENTER) lodStore.setState({ lod: true });
  else if (cur && k > LOD_EXIT) lodStore.setState({ lod: false });
}

/** Subscribe to the LOD flag, gated by per-node eligibility so that ineligible
 *  cards (canvas/image, minimized) never re-render on the flip. */
export const useLod = (eligible: boolean): boolean =>
  useStore(lodStore, (s) => eligible && s.lod);
