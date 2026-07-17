// CodeMirror theme matching the paper look, built from the design tokens in
// theme.ts. The full muted tag set (#8): keywords, strings, numbers, comments,
// function/property/type names, bools; operators and brackets stay quiet.

import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { C, MONO } from "../theme";

export const paperHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: C.kw },
  { tag: tags.moduleKeyword, color: C.kw },
  { tag: tags.definitionKeyword, color: C.kw },
  { tag: tags.controlKeyword, color: C.kw },
  { tag: tags.operatorKeyword, color: C.kw },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: C.str },
  { tag: [tags.number, tags.integer, tags.float], color: C.num },
  { tag: [tags.bool, tags.null, tags.atom], color: C.num },
  { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: C.cmt, fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: C.fn },
  { tag: tags.definition(tags.function(tags.variableName)), color: C.fn },
  { tag: tags.propertyName, color: C.prop },
  { tag: [tags.typeName, tags.className, tags.namespace], color: C.typ },
  { tag: [tags.operator, tags.punctuation], color: C.dim },
]);

// visible, muted scrollbar so a capped/filled editor clearly signals it scrolls
// (Windows hides native overlay scrollbars by default, which read as "no scroll")
const scrollbar = {
  ".cm-scroller::-webkit-scrollbar": { width: "10px", height: "10px" },
  ".cm-scroller::-webkit-scrollbar-thumb": { background: C.dim, borderRadius: "5px",
    border: "2px solid transparent", backgroundClip: "padding-box" },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": { background: C.portLabel },
  ".cm-scroller::-webkit-scrollbar-corner": { background: "transparent" },
} as const;

const shared = {
  "&": { backgroundColor: "transparent", color: C.ink },
  "&.cm-focused": { outline: "none" },
  // the app root sets user-select:none; re-enable it here or the caret is dead
  ".cm-content": { fontFamily: MONO, caretColor: C.ink, padding: "0", userSelect: "text", WebkitUserSelect: "text" },
  ".cm-line": { padding: "0" },
  ".cm-cursor": { borderLeftColor: C.ink },
  // clearly visible (selSoft at 14% reads as "nothing selected" → copy feels broken)
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
    { backgroundColor: "rgba(76,127,174,.30)" },
} as const;

/** In-pane peek editor: 11.5px/17px, grows with content then scrolls once
 *  capped (CodeMirrorEditor sets max-height / a fixed height); overflow lives
 *  here as a persistent rule so it can't be clobbered by construction timing. */
export const paperThemePane = EditorView.theme({
  ...shared,
  ...scrollbar,
  ".cm-content": { ...shared[".cm-content"], fontSize: "11.5px", lineHeight: "17px" },
  ".cm-scroller": { fontFamily: MONO, lineHeight: "17px", overflow: "auto" },
  ".cm-foldPlaceholder": { background: C.headBg, border: `1px solid ${C.edge}`, color: C.dim,
    borderRadius: "3px", padding: "0 5px", margin: "0 2px", cursor: "pointer" },
});

/** Rail editor: 12px/1.7, fills the rail and scrolls natively. Gutter and
 *  active-line chrome styled to the paper look. */
export const paperThemeRail = EditorView.theme({
  ...shared,
  ...scrollbar,
  ".cm-content": { ...shared[".cm-content"], fontSize: "12px", lineHeight: "1.7", padding: "10px 8px" },
  ".cm-scroller": { fontFamily: MONO, lineHeight: "1.7", overflow: "auto" },
  "&": { ...shared["&"], height: "100%" },
  // opaque: the gutter masks horizontally-scrolled code behind it (#19)
  ".cm-gutters": { backgroundColor: C.pane, color: C.faint, border: "none", borderRight: `1px solid ${C.edge}`, fontSize: "10px" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 6px 0 10px", minWidth: "28px" },
  ".cm-activeLine": { backgroundColor: C.headBg },
  ".cm-activeLineGutter": { backgroundColor: C.headBg, color: C.dim },
  "&.cm-focused .cm-matchingBracket": { backgroundColor: C.selSoft, outline: `1px solid ${C.sel}` },
});
