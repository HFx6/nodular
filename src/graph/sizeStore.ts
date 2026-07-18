// Measured node rectangles: a vanilla zustand store the board writes (from a
// ResizeObserver) and pure code reads. Node width is authoritative in the doc,
// but height is content-driven and absent from most nodes — the DOM is the only
// source of truth. Mirrors resultsStore: DOM-side writes, React/pure-side reads,
// no render loop. Values are board (unscaled) pixels — the view transform's
// scale never touches layout px, so no zoom division is needed.

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export interface Size {
  w: number;
  h: number;
}
export type SizeMap = Record<string, Size>;

interface SizeState {
  sizes: SizeMap;
}

export const sizeStore = createStore<SizeState>()(() => ({ sizes: {} }));

export function publishSize(id: string, w: number, h: number): void {
  const cur = sizeStore.getState().sizes[id];
  if (cur && cur.w === w && cur.h === h) return; // ref-stable, no churn
  sizeStore.setState((s) => ({ sizes: { ...s.sizes, [id]: { w, h } } }));
}

export function dropSize(id: string): void {
  sizeStore.setState((s) => {
    if (!(id in s.sizes)) return s;
    const sizes = { ...s.sizes };
    delete sizes[id];
    return { sizes };
  });
}

export const useSizes = (): SizeMap => useStore(sizeStore, (s) => s.sizes);

/** Resolves once every id has a measured size AND the size map has been quiet
 *  for `settle` ms — cards get an early ResizeObserver reading before their
 *  editors finish mounting/growing, so mere existence isn't enough to lay out
 *  against. The `timeout` cap keeps a node that never mounts (or never stops
 *  resizing) from wedging the caller. */
export function whenMeasured(
  ids: string[],
  timeout = 3000,
  settle = 150,
): Promise<void> {
  const ready = () => ids.every((id) => sizeStore.getState().sizes[id]);
  return new Promise((resolve) => {
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const done = () => {
      unsub();
      clearTimeout(cap);
      clearTimeout(quiet);
      resolve();
    };
    const arm = () => {
      clearTimeout(quiet);
      if (ready()) quiet = setTimeout(done, settle);
    };
    const unsub = sizeStore.subscribe(arm);
    const cap = setTimeout(done, timeout);
    arm();
  });
}
