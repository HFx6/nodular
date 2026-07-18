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
      /* paper dropdown chrome, shared by the top menu, node palette and node
         settings — position/size stay inline at the call site */
      .popover{position:absolute; z-index:20; background:${C.pane}; border:1px solid ${C.edge}; border-radius:4px; box-shadow:0 4px 14px rgba(40,40,36,.12)}
      .popitem{padding:5px 12px; font-family:${MONO}; font-size:11.5px; color:${C.ink}; cursor:pointer}
      .popitem:hover{background:${C.headBg}}
      /* port labels: darker than wires + a paper chip so a wire running
         underneath can't swallow them (#4) */
      .olabel{position:absolute; left:100%; padding-left:7px; height:${ROW}px; display:flex; align-items:center; gap:4px;
        font-family:${MONO}; font-size:11px; color:${C.portLabel}; white-space:nowrap; cursor:pointer}
      .olabel:hover{color:${C.ink}}
      .ilabel{position:absolute; right:100%; padding-right:7px; height:${ROW}px; display:flex; align-items:center; gap:4px;
        font-family:${MONO}; font-size:11px; color:${C.portLabel}; white-space:nowrap; cursor:pointer}
      .ilabel:hover{color:${C.ink}}
      .portchip{background:${C.bg}; border-radius:2px; padding:0 3px}
      /* during a drag the whole board keeps one cursor, whatever it passes over (#14) */
      [data-drag="grabbing"], [data-drag="grabbing"] *{cursor:grabbing !important}
      [data-drag="nwse-resize"], [data-drag="nwse-resize"] *{cursor:nwse-resize !important}
      @media (prefers-reduced-motion: no-preference) {
        @keyframes spawn { from { opacity: 0; transform: scale(.96); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(-3px) scale(.98); } }
        @keyframes slidein { from { transform: translateX(14px); opacity: 0; } }
        .ncard{animation: spawn .14s ease-out}
        .popover{animation: fadein .1s ease-out}
        .rail{animation: slidein .15s ease-out}
        .dimmable{transition: opacity .25s ease}
      }
    `}</style>
  );
}
