// Board-level input handling. Phase 2 scope: global keyboard shortcuts.
// The pointer state machine (pan / node drag / marquee / wire drag) moves in
// here as the board interactions complete.

import { useEffect } from "react";
import { redo, undo, useGraphStore } from "../../graph/store";
import { exportFile } from "../../persist/file";

/** True when the event's target is a text-editing surface — those own their keys. */
function inEditor(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return !!t.closest(".cm-editor") || t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement;
}

export function useBoardKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // save works everywhere, including inside an editor
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportFile();
        return;
      }
      if (inEditor(e.target)) {
        // Escape steps out of the editor; everything else belongs to it
        if (e.key === "Escape" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
      const st = useGraphStore.getState();

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        st.tidy();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (st.sel.length) { e.preventDefault(); st.deleteNodes(st.sel); }
      } else if (e.key === "Escape") {
        if (st.arm) st.disarm();
        else if (st.sel.length) st.clearSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
