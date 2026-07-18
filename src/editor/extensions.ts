// Shared, module-level CodeMirror extension sets. Allocated once and reused by
// every editor instance — this is what keeps dozens of live panes cheap
// (ENGINE.md budgets many simultaneous CodeMirror instances per board).

import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, codeFolding, ensureSyntaxTree, foldEffect, foldable, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { paperHighlight, paperThemePane, paperThemeRail } from "./cmTheme";
import { jsLinter } from "./lint";

const langs: Record<string, Extension> = {
  js: javascript(),
  py: python(),
};

const base: Extension = [
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  syntaxHighlighting(paperHighlight),
  EditorState.tabSize.of(2),
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
    // both variants wrap long lines: the pane to the node's width, the rail to
    // its panel width — nothing ever scrolls horizontally
    ext = variant === "pane"
      ? [langs[lang] ?? [], base, codeFolding(), EditorView.lineWrapping, paperThemePane]
      : [langs[lang] ?? [], base, railExtras, EditorView.lineWrapping, lang === "js" ? jsLinter : [], paperThemeRail];
    cache.set(key, ext);
  }
  return ext;
}

/** Collapse top-level blocks (functions, classes) spanning `minLines`+ lines,
 *  so a big module reads as a summary in the in-node pane; click a `…` to
 *  expand. Short snippets are left untouched. */
export function foldLargeTopLevel(view: EditorView, minLines = 8): void {
  const { state } = view;
  const tree = ensureSyntaxTree(state, state.doc.length, 80);
  if (!tree) return;
  const effects = [];
  for (let ch = tree.topNode.firstChild; ch; ch = ch.nextSibling) {
    const start = state.doc.lineAt(ch.from);
    if (state.doc.lineAt(ch.to).number - start.number + 1 < minLines) continue;
    const range = foldable(state, start.from, start.to);
    if (range) effects.push(foldEffect.of(range));
  }
  if (effects.length) view.dispatch({ effects });
}
