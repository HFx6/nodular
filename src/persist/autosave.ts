// IndexedDB autosave — local-first, the doc survives reloads (PROJECT.md).
// Loaded once before first render; saved on a 500ms debounce after doc changes.

import { del, get, set } from "idb-keyval";
import { clearHistory, useGraphStore } from "../graph/store";
import { parseDoc } from "./file";

const KEY = "nodular:doc:v1";
/** The doc's display name is a UI label, not part of the doc — it rides in
 *  localStorage next to the IDB payload so the top bar survives a reload (#10). */
const NAME_KEY = "nodular.docName";

let hydrated = false;

/** Hydrate the store from IndexedDB. Falls back silently to the demo graph. */
export async function loadSavedDoc(): Promise<void> {
  try {
    const doc = parseDoc(await get(KEY));
    if (doc && Object.keys(doc.nodes).length > 0) {
      useGraphStore.getState().setDoc(doc);
      clearHistory();
      hydrated = true;
    }
  } catch {
    // corrupt or unavailable IDB — keep the seed graph
  }
}

/** Name of the doc on the board at first render, or undefined when nothing was
 *  restored and the seed graph is what's showing. Only meaningful after
 *  loadSavedDoc has settled, which main.tsx guarantees before React mounts. */
export function savedDocName(): string | undefined {
  return hydrated ? (localStorage.getItem(NAME_KEY) ?? undefined) : undefined;
}

export function saveDocName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}

/** Drop the saved doc (reset). The next doc change re-saves as usual. */
export async function clearSaved(): Promise<void> {
  try {
    await del(KEY);
  } catch {
    /* nothing to clear */
  }
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
