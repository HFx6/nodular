import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { C, MONO } from "../theme";
import { useNodeInputs } from "../engine/core/resultsStore";
import type { GraphNode } from "../types";

/** What a canvas hands its renderer every animation frame. The surface owns
 *  timing and pointer — it is where interaction originates — so any render
 *  function works against it; nothing here is demo-specific. */
interface Frame {
  t: number;
  dt: number;
  width: number;
  height: number;
  cursor: { x: number; y: number } | null;
}

type RenderFn = (ctx: CanvasRenderingContext2D, frame: Frame) => void;

/** Sink built-in: the canvas's body IS the surface. One input, `render` —
 *  a ƒ(ctx, frame) called in the canvas's own rAF loop. A throwing renderer
 *  is killed (natto-style); a code edit delivers a new function and re-arms. */
export function CanvasNodeBody({ node: n }: { node: GraphNode }) {
  const render = useNodeInputs(n.id)?.render;
  const fn = typeof render === "function" ? (render as RenderFn) : null;
  const ref = useRef<HTMLCanvasElement>(null);
  const cursor = useRef<{ x: number; y: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    const cvs = ref.current;
    if (!cvs || !fn) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const loop = (now: number) => {
      // backing store follows the element's CSS size (width: 100%, 3:2)
      const w = Math.max(1, Math.round(cvs.clientWidth));
      const h = Math.max(1, Math.round(cvs.clientHeight));
      if (cvs.width !== w) cvs.width = w;
      if (cvs.height !== h) cvs.height = h;
      try {
        fn(ctx, { t: (now - t0) / 1000, dt: (now - last) / 1000, width: w, height: h, cursor: cursor.current });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        return;
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fn]);

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const cvs = ref.current;
    if (!cvs) return;
    const r = cvs.getBoundingClientRect(); // robust under the board's zoom transform
    cursor.current = {
      x: ((e.clientX - r.left) / r.width) * cvs.width,
      y: ((e.clientY - r.top) / r.height) * cvs.height,
    };
  };

  // only claim left-button presses; middle-drag must bubble to the board pan
  const stop = (e: ReactPointerEvent) => { if (e.button === 0) e.stopPropagation(); };

  return (
    <div style={{ position: "relative", borderRadius: "0 0 4px 4px", overflow: "hidden" }} onPointerDown={stop}>
      <canvas ref={ref} onPointerMove={onMove} onPointerLeave={() => (cursor.current = null)}
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: String(n.aspect ?? 1.5), cursor: "crosshair", background: C.dark }} />
      {(!fn || err) && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 8,
          fontFamily: MONO, fontSize: 10.5, color: err ? C.bad : "#5b5877", pointerEvents: "none", textAlign: "center" }}>
          {err ? `render error — ${err}` : "no renderer connected"}
        </div>
      )}
    </div>
  );
}
