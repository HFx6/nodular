// The engine: pull-based reactive dataflow over the graph doc (ENGINE.md).
// Framework-free singleton — state lives outside React. Subscribes to the
// zustand doc, marks dirty, and flushes the downstream closure in topological
// order. Per-node epoch counters discard superseded evals; each eval gets an
// AbortSignal that cancels in-flight work (wrapped fetch) when superseded.

import { useGraphStore } from "../../graph/store";
import type { Edge, GraphNode, NodeMap, NodeResult } from "../../types";
import { resolve } from "./registry";
import type { NodeContext, NodeInstance } from "./types";
import { PORTS } from "./types";
import { downstreamClosure, kahnTopo } from "./graph";
import {
  preview,
  publishInputs,
  publishResult,
  publishValue,
  removeNodeResults,
} from "./resultsStore";

interface NodeState {
  epoch: number;
  abort?: AbortController;
  instance?: NodeInstance;
  /** last committed raw "→" value, memoized for downstream gathers */
  value: unknown;
}

const states = new Map<string, NodeState>();
const dirty = new Set<string>();
/** Nodes explicitly run via ▷ — evaluated this flush even when `manual`. */
const forced = new Set<string>();
let scheduled = false;
let flushing = false;
let started = false;

function state(id: string): NodeState {
  let st = states.get(id);
  if (!st) {
    st = { epoch: 0, value: undefined };
    states.set(id, st);
  }
  return st;
}

function schedule(): void {
  if (scheduled || flushing) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    void flush();
  });
}

export function markDirty(ids: Iterable<string>): void {
  for (const id of ids) dirty.add(id);
  if (dirty.size) schedule();
}

/** ▷: force one evaluation of a node (and its downstream) now, bypassing the
 *  manual barrier. Re-eval gathers current upstream values, so a paused node
 *  catches up on everything it slept through with one press. */
export function runNode(id: string): void {
  forced.add(id);
  markDirty([id]);
}

/** ctx.emit for built-in bodies (table row click): commit the node's "→"
 *  value and dirty downstream only — emit never re-runs the emitter. With
 *  `port`, only edges leaving that port dirty: state's set(v) re-flows value
 *  consumers without re-running the caller wired to `set`. */
export function emitValue(id: string, value: unknown, port?: string): void {
  state(id).value = value;
  publishResult(id, preview(value));
  publishValue(id, value);
  const { edges } = useGraphStore.getState();
  markDirty(
    edges
      .filter(
        (e) => e.from[0] === id && (port === undefined || e.from[1] === port),
      )
      .map((e) => e.to[0]),
  );
}

async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    while (dirty.size) {
      const { nodes, edges } = useGraphStore.getState();
      // manual = autorun off: a manual node (and everything only reachable
      // through it) evaluates solely via runNode's forced set.
      const paused = (id: string) => !!nodes[id]?.manual && !forced.has(id);
      const work = downstreamClosure(
        [...dirty].filter((id) => !paused(id)),
        edges,
        paused,
      );
      dirty.clear();
      forced.clear();
      const { order, cyclic } = kahnTopo(work, edges);
      for (const id of cyclic) {
        publishResult(id, {
          v: null,
          k: "error",
          why: "cycle — node is part of a dependency loop",
        });
      }
      // sequential for v0; kahn's layers make this parallelizable later
      for (const id of order) await evalNode(id);
    }
  } finally {
    flushing = false;
    if (dirty.size) schedule();
  }
}

/** Resolve the value an upstream port carries. "→" is the default port: for a
 *  module namespace (Symbol.toStringTag === "Module") it unwraps `default`;
 *  otherwise it is the node's whole value. A named port reads that export off the
 *  value. Generic on value shape — the core never learns what a "module" is, so
 *  js-module exports and (later) Python defs flow through the same path. */
export function portValue(value: unknown, port: string): unknown {
  if (value == null) return undefined;
  if ((value as Record<symbol, unknown>)[PORTS])
    return (value as Record<string, unknown>)[port];
  const isNs =
    (value as Record<symbol, unknown>)[Symbol.toStringTag] === "Module";
  if (port === "→")
    return isNs ? (value as Record<string, unknown>).default : value;
  return (value as Record<string, unknown>)[port];
}

/** Upstream committed values by input-port name: "→" edges carry the node's
 *  value (default export unwrapped for module namespaces); named-export edges
 *  read the matching export. */
function gatherInputs(id: string, edges: Edge[]): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};
  for (const e of edges) {
    if (e.to[0] !== id) continue;
    inputs[e.to[1]] = portValue(states.get(e.from[0])?.value, e.from[1]);
  }
  return inputs;
}

const IDENT = /^[A-Za-z_$][\w$]*$/;
const RESERVED = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "fetch", // injected by the adapter
]);

/** Input-port names that can become function parameters. */
function inputNamesFor(id: string, edges: Edge[]): string[] {
  const names: string[] = [];
  for (const e of edges) {
    const name = e.to[1];
    if (
      e.to[0] === id &&
      IDENT.test(name) &&
      !RESERVED.has(name) &&
      !names.includes(name)
    ) {
      names.push(name);
    }
  }
  return names;
}

async function evalNode(id: string): Promise<void> {
  const { nodes, edges } = useGraphStore.getState();
  const n = nodes[id];
  if (!n) return;
  const r = resolve(n);
  if (!r) return;

  const st = state(id);
  const epoch = ++st.epoch;
  st.abort?.abort();
  const abort = new AbortController();
  st.abort = abort;
  const ctx: NodeContext = {
    signal: abort.signal,
    emit: (v) => emitValue(id, v),
  };
  const inputs = gatherInputs(id, edges);

  if (r.kind === "builtin") {
    st.instance ??= r.def.create();
    publishInputs(id, inputs);
    try {
      const v = st.instance.update(inputs, ctx);
      if (v !== undefined) {
        st.value = v;
        publishResult(id, preview(v));
        publishValue(id, v);
      }
    } catch (err) {
      publishResult(id, errorResult(err));
    }
    return;
  }

  let exe;
  try {
    exe = r.adapter.instantiate(
      n.code ?? "",
      inputNamesFor(id, edges),
      n.valueMode,
    );
  } catch (err) {
    publishResult(id, errorResult(err));
    return;
  }
  if ("static" in exe) {
    st.value = undefined;
    publishResult(id, exe.static);
    return;
  }
  try {
    const v = await exe(inputs, ctx);
    if (st.epoch !== epoch) return; // superseded mid-await
    st.value = v;
    publishResult(id, preview(v));
    publishValue(id, v);
  } catch (err) {
    if (st.epoch !== epoch || isAbort(err)) return;
    publishResult(id, errorResult(err));
  }
}

function errorResult(err: unknown): NodeResult {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    v: null,
    k: "error",
    why: msg.length > 160 ? msg.slice(0, 159) + "…" : msg,
  };
}

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

function dropNode(id: string, prevEdges: Edge[], dirtyOut: Set<string>): void {
  const st = states.get(id);
  if (st) {
    st.abort?.abort();
    st.instance?.teardown?.();
    states.delete(id);
  }
  removeNodeResults(id);
  for (const e of prevEdges) {
    if (e.from[0] === id) dirtyOut.add(e.to[0]); // may be gone too; evalNode guards
  }
}

/** Diff the doc on every store change: code edits and new nodes dirty
 *  themselves, removed nodes tear down and dirty their former downstream,
 *  edge changes dirty the target (its inputs changed). setDoc, undo/redo, and
 *  file import all fall out of the same diff. */
function onDocChange(
  s: { nodes: NodeMap; edges: Edge[] },
  p: { nodes: NodeMap; edges: Edge[] },
): void {
  if (s.nodes === p.nodes && s.edges === p.edges) return;
  const next = new Set<string>();
  if (s.nodes !== p.nodes) {
    for (const id in s.nodes) {
      const prev: GraphNode | undefined = p.nodes[id];
      if (
        !prev ||
        prev.code !== s.nodes[id]!.code ||
        prev.valueMode !== s.nodes[id]!.valueMode
      )
        next.add(id);
    }
    for (const id in p.nodes) {
      if (!s.nodes[id]) dropNode(id, p.edges, next);
    }
  }
  if (s.edges !== p.edges) {
    const prev = new Set(p.edges);
    const cur = new Set(s.edges);
    for (const e of s.edges) if (!prev.has(e)) next.add(e.to[0]);
    for (const e of p.edges)
      if (!cur.has(e) && s.nodes[e.to[0]]) next.add(e.to[0]);
  }
  markDirty(next);
}

/** Boot: subscribe to the doc and mark the whole graph dirty — first load
 *  takes the same path as every incremental edit. Idempotent. */
export function startEngine(): void {
  if (started) return;
  started = true;
  useGraphStore.subscribe(onDocChange);
  markDirty(Object.keys(useGraphStore.getState().nodes));
}
