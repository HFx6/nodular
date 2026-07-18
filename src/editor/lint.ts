// Syntax diagnostics for js nodes via acorn (already the engine's parser —
// no new dependency). Parse-permissive to match node code styles: modules,
// top-level await, and bare return bodies all pass.

import { linter, type Diagnostic } from "@codemirror/lint";
import { parse } from "acorn";

export const jsLinter = linter((view): Diagnostic[] => {
  const src = view.state.doc.toString();
  if (!src.trim()) return [];
  try {
    parse(src, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });
    return [];
  } catch (e) {
    const len = view.state.doc.length;
    const pos = Math.min((e as { pos?: number }).pos ?? 0, len);
    return [
      {
        from: pos,
        to: Math.min(pos + 1, len),
        severity: "error",
        message: (e as Error).message.replace(/\s*\(\d+:\d+\)$/, ""),
      },
    ];
  }
});
