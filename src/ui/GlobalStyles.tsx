import {
  C,
  EASE,
  GRID,
  HEAD,
  MONO,
  RADIUS,
  ROW,
  SANS,
  SHADOW,
  TRACK,
} from "../theme";

/** Emits every design token from theme.ts as a CSS custom property on :root.
 *  theme.ts stays the single source of truth (geometry/canvas code needs the
 *  raw TS values); the stylesheet (index.css) consumes only the vars, so the
 *  whole design is tweakable from theme.ts — or live in devtools via :root. */
export function GlobalStyles() {
  return (
    <style>{`
      :root{
        ${Object.entries(C)
          .map(([k, v]) => `--${k}:${v};`)
          .join(" ")}
        --mono:${MONO}; --sans:${SANS}; --track:${TRACK};
        --radius:${RADIUS}px; --row:${ROW}px; --head:${HEAD}px; --grid:${GRID}px;
        --shadow-card:${SHADOW.card}; --shadow-pop:${SHADOW.pop}; --ease:${EASE};
      }
    `}</style>
  );
}
