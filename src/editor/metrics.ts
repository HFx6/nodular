// Deterministic geometry of the in-node code pane. Node heights are computed
// from the doc alone (code text + node width) and applied as explicit CSS
// heights BEFORE CodeMirror renders — so a card is born at its final size and
// never grows when the editor mounts, folds, or the engine produces a value.
// CodeMirror mounts into the box; it must never define the box.
//
// The pane is: mono 12.5px at a 19px line pitch, .code-edit padding 10/12, line
// wrapped, no gutter, capped at PANE_MAX_H then scrolls. Those constants are
// mirrored from cmTheme.paperThemePane / index.css .code-edit — keep in sync.

import { EditorState } from "@codemirror/state";
import { MONO } from "../theme";
import { langs, paneFoldRanges } from "./extensions";

const LINE_H = 19; // .cm-content line-height
const PAD_V = 20; // .code-edit padding: 10 top + 10 bottom
const PAD_H = 12; // .code-edit padding-left/right
const BORDER = 1; // card border (both sides negligible; one absorbed elsewhere)
/** Max reserved editor content height for an auto node before it scrolls in
 *  place. Deliberately short — an in-node peek is a glance, not the full file;
 *  the rail is where you actually read/edit. ≈9 lines. */
const PANE_CAP = 171; // 9 × 19
/** value footer strip reserved under a default-mode code node (28px + 1px rule) */
export const FOOT_H = 29;
/** gap between editor and value face when a render face is present (.code-div) */
export const FACE_DIV = 7;
/** reserved value-face height for an auto (unfixed) faced code node */
export const FACE_H = 216;

/** Advance width of one monospace char at 12.5px — measured once against the
 *  real font, cached. Falls back to a sane constant before/without a canvas. */
let cachedCharW = 0;
export function charW(): number {
  if (cachedCharW) return cachedCharW;
  if (typeof document === "undefined") return 7.5;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 7.5;
  ctx.font = `12.5px ${MONO}`;
  const w = ctx.measureText("MMMMMMMMMM").width / 10;
  cachedCharW = w > 0 ? w : 7.5;
  return cachedCharW;
}

export interface VisLine {
  indent: number; // leading whitespace columns (tabs counted as 2)
  chars: number; // trimmed visible length
}

const MAX_VIS = 32; // height caps ~15 rows; the skeleton needs ≤16 — stop early
const cache = new Map<string, VisLine[]>();
const CACHE_MAX = 400;

/** The lines the pane actually renders: source minus the interiors of the
 *  top-level blocks the pane auto-folds on mount (same rule as
 *  foldLargeTopLevel, via the shared paneFoldRanges). */
export function visibleLines(code: string, lang: string): VisLine[] {
  const key = `${lang}\0${code}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const state = EditorState.create({
    doc: code,
    extensions: [langs[lang] ?? []],
  });
  // a line number is hidden if it lies strictly inside a folded range (the
  // fold keeps the range's first line visible with a `…` placeholder)
  const folded: Array<[number, number]> = [];
  for (const r of paneFoldRanges(state)) {
    const from = state.doc.lineAt(r.from).number;
    const to = state.doc.lineAt(r.to).number;
    if (to > from) folded.push([from + 1, to]);
  }
  const hidden = (ln: number) => folded.some(([a, b]) => ln >= a && ln <= b);

  const out: VisLine[] = [];
  const total = state.doc.lines;
  for (let i = 1; i <= total && out.length < MAX_VIS; i++) {
    if (hidden(i)) continue;
    const text = state.doc.line(i).text;
    const trimmed = text.trim();
    let indent = 0;
    for (const c of text) {
      if (c === "\t") indent += 2;
      else if (c === " ") indent += 1;
      else break;
    }
    out.push({ indent, chars: trimmed.length });
  }

  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(key, out);
  return out;
}

export interface Row {
  x: number; // bar left offset in px (indent on the first row, 0 on wraps)
  w: number; // bar width in px (0 = blank line)
}

/** The visual rows the pane renders — one logical line becomes several when it
 *  wraps. Char-based, mirroring CodeMirror's soft wrap (wraps to column 0, no
 *  hanging indent). Drives BOTH the reserved height and the LOD skeleton, so a
 *  bar always sits on the row its text sits on. */
export function paneRows(code: string, lang: string, nodeW: number): Row[] {
  const w = charW();
  const cols = Math.max(1, Math.floor((nodeW - BORDER - PAD_H * 2) / w));
  const rows: Row[] = [];
  for (const l of visibleLines(code, lang)) {
    if (l.chars === 0) {
      rows.push({ x: 0, w: 0 });
      continue;
    }
    let col = l.indent; // text starts after the indent on the first row
    let rem = l.chars;
    while (rem > 0) {
      const take = Math.min(rem, Math.max(1, cols - col));
      rows.push({ x: col * w, w: take * w });
      rem -= take;
      col = 0; // continuation wraps to the left edge
    }
  }
  return rows;
}

/** Rendered editor-region height (incl. padding) for auto (unfixed) code. */
export function paneEditorH(code: string, lang: string, nodeW: number): number {
  const rows = Math.max(1, paneRows(code, lang, nodeW).length);
  return Math.min(rows * LINE_H, PANE_CAP) + PAD_V;
}

/** Total body height (below the header) of an auto code node. */
export function codeBodyH(
  code: string,
  lang: string,
  nodeW: number,
  faced: boolean,
): number {
  const editor = paneEditorH(code, lang, nodeW);
  return faced ? editor + FACE_DIV + FACE_H : editor + FOOT_H;
}
