// IndexedDB autosave — local-first, the doc survives reloads (PROJECT.md).
// Loaded once before first render; saved on a 500ms debounce after doc changes.

import { del, get, set } from "idb-keyval";
import { clearHistory, useGraphStore } from "../graph/store";
import { parseDoc } from "./file";

const KEY = "nodular:doc:v1";

/** Hydrate the store from IndexedDB. Falls back silently to the demo graph. */
export async function loadSavedDoc(): Promise<void> {
  try {
    const doc = parseDoc(await get(KEY));
    if (doc && Object.keys(doc.nodes).length > 0) {
      useGraphStore.getState().setDoc(doc);
      clearHistory();
    }
  } catch {
    // corrupt or unavailable IDB — keep the seed graph
  }
}

/** Drop the saved doc (reset). The next doc change re-saves as usual. */
export async function clearSaved(): Promise<void> {
  try { await del(KEY); } catch { /* nothing to clear */ }
}

/** Subscribe to doc changes and persist them, debounced. Call once at startup. */
export function startAutosave(): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  useGraphStore.subscribe((s, prev) => {
    if (s.nodes === prev.nodes && s.edges === prev.edges) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const { nodes, edges } = useGraphStore.getState();
      void set(KEY, { version: 1, nodes, edges }).catch(() => {});
    }, 500);
  });
}
