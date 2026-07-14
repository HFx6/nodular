import { useEffect, useRef, type RefObject } from "react";
import { C } from "../theme";
import type { LiveState } from "../types";

interface Walker {
  x: number;
  y: number;
  h: [number, number][];
}

/** The screen surface: walkers chasing the cursor. `count` is live and the
 *  renderer connection is inferred; both are read from the runtime ref. */
export function Surface({ live }: { live: RefObject<LiveState> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let raf: number;
    const walkers: Walker[] = [];
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      live.current.cursor = { x: ((e.clientX - r.left) / r.width) * cv.width, y: ((e.clientY - r.top) / r.height) * cv.height };
    };
    const onLeave = () => (live.current.cursor = null);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    const loop = () => {
      const { count, rendered, cursor } = live.current;
      live.current.t++;
      while (walkers.length < count) walkers.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, h: [] });
      walkers.length = Math.max(0, count);
      ctx.fillStyle = C.dark; ctx.fillRect(0, 0, cv.width, cv.height);
      if (!rendered) {
        ctx.fillStyle = "#5b5877"; ctx.font = "11px monospace";
        ctx.fillText("no renderer connected", cv.width / 2 - 62, cv.height / 2);
      } else {
        ctx.strokeStyle = "rgba(217,215,235,.55)"; ctx.lineWidth = 1;
        for (const w of walkers) {
          let dx = (Math.random() - 0.5) * 4, dy = (Math.random() - 0.5) * 4;
          if (cursor) { dx += (cursor.x - w.x) * 0.012; dy += (cursor.y - w.y) * 0.012; }
          w.x = Math.max(0, Math.min(cv.width, w.x + dx));
          w.y = Math.max(0, Math.min(cv.height, w.y + dy));
          w.h.push([w.x, w.y]); if (w.h.length > 14) w.h.shift();
          ctx.beginPath();
          w.h.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
        ctx.fillStyle = C.darkInk; ctx.font = "10px monospace";
        ctx.fillText(`${walkers.length} walkers`, 10, 16);
        if (cursor) { ctx.fillStyle = "#d9a13f"; ctx.fillRect(cursor.x - 2, cursor.y - 2, 4, 4); }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); };
  }, [live]);
  return <canvas ref={ref} width={286} height={190} style={{ display: "block", width: "100%", height: "auto", aspectRatio: "286 / 190", cursor: "crosshair" }} />;
}
