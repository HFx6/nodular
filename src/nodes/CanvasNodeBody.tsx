import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNodeInputs } from "../engine/core/resultsStore";
import { zoomNow } from "../graph/lodStore";
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

/** default display aspect (width/height) when neither the renderer nor the
 *  node declares a size */
const DEFAULT_ASPECT = 1.5;

/** Sink built-in: the canvas's body IS the surface. One input, `render`, which
 *  is either a bare `ƒ(ctx, frame)` — the surface owns the resolution and the
 *  backing store follows its display size — or `{ draw, width, height }`, where
 *  the renderer declares its own pixel size and the surface becomes exactly
 *  that many pixels, scaled to fit the node (an NES render sets 256×240 from
 *  its own code). A throwing renderer is killed (natto-style); a code edit
 *  delivers a fresh function and re-arms. */
export function CanvasNodeBody({ node: n }: { node: GraphNode }) {
  const render = useNodeInputs(n.id)?.render;
  // render input: ƒ(ctx, frame) or { draw: ƒ, width, height }
  let fn: RenderFn | null = null;
  let nativeW: number | null = null;
  let nativeH: number | null = null;
  if (typeof render === "function") {
    fn = render as RenderFn;
  } else if (
    render &&
    typeof render === "object" &&
    typeof (render as { draw?: unknown }).draw === "function"
  ) {
    const spec = render as {
      draw: RenderFn;
      width?: unknown;
      height?: unknown;
    };
    fn = spec.draw;
    if (
      typeof spec.width === "number" &&
      spec.width > 0 &&
      typeof spec.height === "number" &&
      spec.height > 0
    ) {
      nativeW = Math.round(spec.width);
      nativeH = Math.round(spec.height);
    }
  }
  const native = nativeW && nativeH;

  const ref = useRef<HTMLCanvasElement>(null);
  const cursor = useRef<{ x: number; y: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    const cvs = ref.current;
    if (!cvs || !fn) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // pause the draw loop entirely when the canvas is panned fully off-screen —
    // for the emulators the draw loop *is* the game, so it freezes and resumes
    // in place. IO uses painted geometry, so it's correct under the board zoom.
    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(cvs);

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const loop = (now: number) => {
      if (!visible) {
        // keep the clock advancing so dt doesn't spike on resume, but do no work
        last = now;
        raf = requestAnimationFrame(loop);
        return;
      }
      // a declared size fixes the backing store; otherwise it follows the
      // element's CSS size scaled to how many pixels it actually occupies on
      // screen — zoomed out, a canvas draws at a fraction of the resolution.
      // Quantised to 1/4 steps so wheel zoom doesn't reallocate every frame.
      const scale = native
        ? 1
        : Math.max(0.25, Math.ceil(zoomNow.k * 4) / 4) *
          (window.devicePixelRatio || 1);
      const w = native
        ? nativeW!
        : Math.max(1, Math.round(cvs.clientWidth * scale));
      const h = native
        ? nativeH!
        : Math.max(1, Math.round(cvs.clientHeight * scale));
      if (cvs.width !== w) cvs.width = w;
      if (cvs.height !== h) cvs.height = h;
      try {
        fn(ctx, {
          t: (now - t0) / 1000,
          dt: (now - last) / 1000,
          width: w,
          height: h,
          cursor: cursor.current,
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        return;
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [fn, native, nativeW, nativeH]);

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
  const stop = (e: ReactPointerEvent) => {
    if (e.button === 0) e.stopPropagation();
  };

  return (
    <div className="canvas-wrap" onPointerDown={stop}>
      <canvas
        className="canvas-surf"
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => (cursor.current = null)}
        style={{
          aspectRatio: native
            ? `${nativeW} / ${nativeH}`
            : String(n.aspect ?? DEFAULT_ASPECT),
          // fixed-resolution surfaces are upscaled by CSS — keep their pixels crisp
          imageRendering: native ? "pixelated" : "auto",
        }}
      />
      {(!fn || err) && (
        <div className={`canvas-hint${err ? " bad" : ""}`}>
          {err ? `render error — ${err}` : "no renderer connected"}
        </div>
      )}
    </div>
  );
}
