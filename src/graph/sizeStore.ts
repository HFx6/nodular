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

/** Resolves once every id has a measured size — or after `timeout` ms, so a
 *  node that never mounts can't wedge the caller. */
export function whenMeasured(ids: string[], timeout = 800): Promise<void> {
  const ready = () => ids.every((id) => sizeStore.getState().sizes[id]);
  if (ready()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { unsub(); clearTimeout(t); resolve(); };
    const unsub = sizeStore.subscribe(() => { if (ready()) done(); });
    const t = setTimeout(done, timeout);
  });
}
