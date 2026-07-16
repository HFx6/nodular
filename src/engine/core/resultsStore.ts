// The engine's output surface: a vanilla zustand store the engine writes and
// React reads through per-id hooks. The engine never reads it back and React
// never writes it, so no render loop is possible. Raw values stay in the
// engine; only display previews and built-in inputs cross into React.

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import type { NodeResult } from "../../types";

interface ResultsState {
  results: Record<string, NodeResult>;
  /** resolved inputs for built-in bodies (table rows, image url) */
  nodeInputs: Record<string, Record<string, unknown>>;
}

export const resultsStore = createStore<ResultsState>()(() => ({
  results: {},
  nodeInputs: {},
}));

export function publishResult(id: string, res: NodeResult): void {
  const cur = resultsStore.getState().results[id];
  if (cur && cur.v === res.v && cur.k === res.k && cur.why === res.why) return;
  resultsStore.setState((s) => ({ results: { ...s.results, [id]: res } }));
}

export function publishInputs(id: string, inputs: Record<string, unknown>): void {
  resultsStore.setState((s) => ({ nodeInputs: { ...s.nodeInputs, [id]: inputs } }));
}

export function removeNodeResults(id: string): void {
  resultsStore.setState((s) => {
    const results = { ...s.results };
    const nodeInputs = { ...s.nodeInputs };
    delete results[id];
    delete nodeInputs[id];
    return { results, nodeInputs };
  });
}

export function useNodeResult(id: string): NodeResult | undefined {
  return useStore(resultsStore, (s) => s.results[id]);
}

export function useNodeInputs(id: string): Record<string, unknown> | undefined {
  return useStore(resultsStore, (s) => s.nodeInputs[id]);
}

/** Display preview of a raw value: capped JSON + a kind badge. */
export function preview(v: unknown): NodeResult {
  if (v === undefined) return { v: null, why: "no result" };
  if (v === null) return { v: "null", k: "null" };
  switch (typeof v) {
    case "number": return { v: String(v), k: "num" };
    case "boolean": return { v: String(v), k: "bool" };
    case "string": return { v: cap(JSON.stringify(v)), k: "str" };
    case "function": return { v: "ƒ", k: "fn" };
    default:
      return Array.isArray(v)
        ? { v: cap(json(v)), k: `arr(${v.length})` }
        : { v: cap(json(v)), k: "obj" };
  }
}

function json(v: unknown): string {
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}

function cap(s: string): string {
  return s.length > 120 ? s.slice(0, 119) + "…" : s;
}
