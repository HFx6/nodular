import { C, MONO, ROW } from "../theme";

/** Global keyframes and shared class hooks (design tokens live in theme.ts). */
export function GlobalStyles() {
  return (
    <style>{`
      @keyframes drift { to { stroke-dashoffset: -16; } }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      textarea:focus{outline:none}
      .ctrl{color:${C.faint}; font-size:11px; cursor:pointer; line-height:1} .ctrl:hover{color:${C.ink}}
      .olabel{display:flex; justify-content:flex-end; align-items:center; gap:5px; height:${ROW}px;
        font-family:${MONO}; font-size:11px; color:${C.dim}; cursor:pointer; padding-right:10px}
      .olabel:hover{color:${C.ink}}
      .ilabel{position:absolute; right:100%; padding-right:7px; height:${ROW}px; display:flex; align-items:center;
        font-family:${MONO}; font-size:11px; color:${C.dim}; white-space:nowrap; cursor:pointer}
      .ilabel:hover{color:${C.ink}}
    `}</style>
  );
}
