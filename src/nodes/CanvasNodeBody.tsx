import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { LiveState } from "../types";
import { Surface } from "./Surface";

/** Sink built-in: the canvas's body IS the surface. No ports, no outputs. */
export function CanvasNodeBody({ live }: { live: RefObject<LiveState> }) {
  const stop = (e: ReactPointerEvent) => e.stopPropagation();
  return (
    <div style={{ borderRadius: "0 0 4px 4px", overflow: "hidden" }} onPointerDown={stop}>
      <Surface live={live} />
    </div>
  );
}
