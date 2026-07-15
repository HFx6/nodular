// Inference dispatch + caching. One entry point (`outsFor`) that geometry and
// node bodies call per render: memoized on the exact code string, with a
// per-node last-good fallback so a half-typed line never flickers handles.

import type { ExportInfo, GraphNode } from "../../types";
import type { InferFn } from "./types";
import { inferJs } from "./js";
import { inferPy } from "./py";

export { pyResult } from "./py";
export type { InferredInterface } from "./types";

const infer: Record<string, InferFn> = { js: inferJs, py: inferPy };

const byCode = new Map<string, ExportInfo[]>();
const lastGood = new Map<string, ExportInfo[]>();

export function outsFor(n: GraphNode): ExportInfo[] {
  const fn = infer[n.lang];
  if (!fn) return [];
  const code = n.code ?? "";
  const hit = byCode.get(code);
  if (hit) { lastGood.set(n.id, hit); return hit; }
  try {
    const outs = fn(code).outputs;
    if (byCode.size > 500) byCode.clear();
    byCode.set(code, outs);
    lastGood.set(n.id, outs);
    return outs;
  } catch {
    return lastGood.get(n.id) ?? [];
  }
}
