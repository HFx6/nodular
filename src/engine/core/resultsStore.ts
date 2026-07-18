// The engine's output surface: a vanilla zustand store the engine writes and
// React reads through per-id hooks. The engine never reads it back and React
// never writes it, so no render loop is possible. Raw values stay in the
// engine; only display previews and built-in inputs cross into React.

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import type { NodeResult } from "../../types";
import { PORTS } from "./types";

interface ResultsState {
  results: Record<string, NodeResult>;
  /** resolved inputs for built-in bodies (table rows, image url) */
  nodeInputs: Record<string, Record<string, unknown>>;
  /** raw "→" values by id, for value faces (render output modes). The engine
   *  already retains every raw value in its states map — this adds a
   *  reference, not memory. Mutation of a published value won't re-render
   *  (ref equality), same as engine memoization. */
  values: Record<string, unknown>;
  /** whole node values by id, before "→" extraction — module namespaces and
   *  ports records keep their named exports, so wire badges can preview what
   *  a named-export edge carries. Same reference-not-memory argument. */
  raws: Record<string, unknown>;
}

export const resultsStore = createStore<ResultsState>()(() => ({
  results: {},
  nodeInputs: {},
  values: {},
  raws: {},
}));

export function publishResult(id: string, res: NodeResult): void {
  const cur = resultsStore.getState().results[id];
  if (cur && cur.v === res.v && cur.k === res.k && cur.why === res.why) return;
  resultsStore.setState((s) => ({ results: { ...s.results, [id]: res } }));
}

export function publishInputs(
  id: string,
  inputs: Record<string, unknown>,
): void {
  resultsStore.setState((s) => ({
    nodeInputs: { ...s.nodeInputs, [id]: inputs },
  }));
}

export function publishValue(id: string, v: unknown): void {
  const raw = v;
  // ports records cross as their "→" value (consistent with preview)
  if (v != null && (v as Record<symbol, unknown>)[PORTS])
    v = (v as Record<string, unknown>)["→"];
  const cur = resultsStore.getState();
  if (Object.is(cur.values[id], v) && Object.is(cur.raws[id], raw)) return;
  resultsStore.setState((s) => ({
    values: { ...s.values, [id]: v },
    raws: { ...s.raws, [id]: raw },
  }));
}

export function removeNodeResults(id: string): void {
  resultsStore.setState((s) => {
    const results = { ...s.results };
    const nodeInputs = { ...s.nodeInputs };
    const values = { ...s.values };
    const raws = { ...s.raws };
    delete results[id];
    delete nodeInputs[id];
    delete values[id];
    delete raws[id];
    return { results, nodeInputs, values, raws };
  });
}

export function useNodeResult(id: string): NodeResult | undefined {
  return useStore(resultsStore, (s) => s.results[id]);
}

export function useNodeInputs(id: string): Record<string, unknown> | undefined {
  return useStore(resultsStore, (s) => s.nodeInputs[id]);
}

export function useNodeValue(id: string): unknown {
  return useStore(resultsStore, (s) => s.values[id]);
}

/** Display preview of a raw value: a readable one-liner + a kind badge. */
export function preview(v: unknown): NodeResult {
  // ports records preview as their "→" value (a state node shows its value, not the record)
  if (v != null && (v as Record<symbol, unknown>)[PORTS]) {
    return preview((v as Record<string, unknown>)["→"]);
  }
  if (v === undefined) return { v: null, why: "no result" };
  if (v === null) return { v: "null", k: "null" };
  switch (typeof v) {
    case "number":
      return { v: String(v), k: "num" };
    case "boolean":
      return { v: String(v), k: "bool" };
    case "string":
      return { v: cap(JSON.stringify(v)), k: "str" };
    case "function":
      return { v: "ƒ", k: "fn" };
    default: {
      if (Array.isArray(v))
        return { v: cap(arrLine(v)), k: `arr(${v.length})` };
      if (v instanceof Promise)
        return { v: "Promise — await it or .then a value out", k: "promise" };
      if (v instanceof Date) return { v: v.toISOString(), k: "date" };
      if (v instanceof Error)
        return { v: cap(`${v.name}: ${v.message}`), k: "Error" };
      if (v instanceof Map)
        return {
          v: cap(objLine(Object.fromEntries(v), `Map(${v.size})`)),
          k: "map",
        };
      if (v instanceof Set)
        return { v: cap(arrLine([...v])), k: `set(${v.size})` };
      // class instances lead with the constructor name — a Response, a
      // CanvasRenderingContext2D etc. is its type, not its (often empty) keys
      const ctor = (v as object).constructor;
      const tag = ctor && ctor !== Object && ctor.name ? ctor.name : undefined;
      return { v: cap(objLine(v as object, tag)), k: "obj" };
    }
  }
}

/** One-token rendering of a value nested inside a collection preview. */
function inline(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  switch (typeof v) {
    case "string":
      return JSON.stringify(v.length > 24 ? v.slice(0, 23) + "…" : v);
    case "function":
      return "ƒ";
    case "object":
      return Array.isArray(v) ? `[${v.length}]` : `{…}`;
    default:
      return String(v);
  }
}

function arrLine(a: unknown[]): string {
  if (!a.length) return "[0]";
  const head = a.slice(0, 4).map(inline).join(", ");
  return `[${a.length}] ${head}${a.length > 4 ? ", …" : ""}`;
}

function objLine(o: object, tag?: string): string {
  let keys: string[];
  try {
    keys = Object.keys(o);
  } catch {
    return tag ?? String(o);
  }
  if (!keys.length) return tag ?? "{}";
  const shown = keys
    .slice(0, 3)
    .map((k) => `${k}: ${inline((o as Record<string, unknown>)[k])}`)
    .join(", ");
  const line = `{ ${shown}${keys.length > 3 ? ", …" : ""} }`;
  return tag ? `${tag} ${line}` : line;
}

function cap(s: string): string {
  return s.length > 120 ? s.slice(0, 119) + "…" : s;
}
