// Inference dispatch + caching. One entry point (`outsFor`) that geometry and
// node bodies call per render — it delegates to the registered language
// adapters (one interface source of truth, ENGINE.md), memoized on the exact
// code string with a per-node last-good fallback so a half-typed line never
// flickers handles.

import type { ExportInfo, GraphNode } from "../../types";
import { adapterFor } from "../core/registry";

export { pyResult } from "./py";
export type { InferredInterface } from "./types";

const byCode = new Map<string, ExportInfo[]>();
const lastGood = new Map<string, ExportInfo[]>();

export function outsFor(n: GraphNode): ExportInfo[] {
  // any explicit editor-value mode rules out exports (expr/body/text can't
  // export) — before the cache, which keys on lang+code only
  if (n.valueMode && n.valueMode !== "auto") return [];
  const adapter = adapterFor(n.lang);
  if (!adapter) return [];
  const code = n.code ?? "";
  const key = n.lang + "\0" + code;
  const hit = byCode.get(key);
  if (hit) { lastGood.set(n.id, hit); return hit; }
  try {
    const outs = adapter.inferInterface(code).outputs;
    if (byCode.size > 500) byCode.clear();
    byCode.set(key, outs);
    lastGood.set(n.id, outs);
    return outs;
  } catch {
    return lastGood.get(n.id) ?? [];
  }
}
