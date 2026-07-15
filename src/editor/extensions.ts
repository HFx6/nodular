// Shared, module-level CodeMirror extension sets. Allocated once and reused by
// every editor instance — this is what keeps dozens of live panes cheap
// (ENGINE.md budgets many simultaneous CodeMirror instances per board).

import { EditorState, type Extension } from "@codemirror/state";
import { highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { paperHighlight, paperThemePane, paperThemeRail } from "./cmTheme";

const langs: Record<string, Extension> = {
  js: javascript(),
  py: python(),
};

const base: Extension = [
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  syntaxHighlighting(paperHighlight),
  EditorState.tabSize.of(2),
  // no lineWrapping extension: default is off, matching the old wrap="off"
];

// the rail is the "real editor": gutter, active line, brackets, auto-indent
const railExtras: Extension = [
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  bracketMatching(),
  indentOnInput(),
];

const cache = new Map<string, Extension>();

export function editorExtensions(lang: string, variant: "pane" | "rail"): Extension {
  const key = `${lang}:${variant}`;
  let ext = cache.get(key);
  if (!ext) {
    ext = variant === "pane"
      ? [langs[lang] ?? [], base, paperThemePane]
      : [langs[lang] ?? [], base, railExtras, paperThemeRail];
    cache.set(key, ext);
  }
  return ext;
}
