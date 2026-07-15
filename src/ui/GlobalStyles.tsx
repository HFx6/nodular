import { C, MONO, ROW } from "../theme";

/** Global keyframes and shared class hooks (design tokens live in theme.ts). */
export function GlobalStyles() {
  return (
    <style>{`
      @keyframes drift { to { stroke-dashoffset: -16; } }
      textarea:focus{outline:none}
      /* the app root is user-select:none; editors must stay selectable no
         matter what specificity/injection order the CM theme ends up with */
      .cm-content, .cm-content * { user-select: text !important; -webkit-user-select: text !important; }
      .ctrl{color:${C.faint}; font-size:11px; cursor:pointer; line-height:1; padding:5px; margin:-5px} .ctrl:hover{color:${C.ink}}
      .olabel{position:absolute; left:100%; padding-left:7px; height:${ROW}px; display:flex; align-items:center; gap:4px;
        font-family:${MONO}; font-size:11px; color:${C.dim}; white-space:nowrap; cursor:pointer}
      .olabel:hover{color:${C.ink}}
      .ilabel{position:absolute; right:100%; padding-right:7px; height:${ROW}px; display:flex; align-items:center;
        font-family:${MONO}; font-size:11px; color:${C.dim}; white-space:nowrap; cursor:pointer}
      .ilabel:hover{color:${C.ink}}
    `}</style>
  );
}
