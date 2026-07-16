// The engine's contracts (ENGINE.md). The core never branches on language or
// node kind — it only speaks these interfaces, resolved through the registry.
// Python kernels, js-module, streams, and workers arrive as new registrations,
// not core changes.

import type { GraphNode, NodeResult } from "../../types";
import type { InferredInterface } from "../inference/types";

/** Value ports are memoized and re-delivered each eval; stream ports are
 *  ephemeral, coalesced to latest per animation frame. v0 implements value
 *  semantics only — the type exists so schedulers grow into it. */
export type PortSemantics = "value" | "stream";

/** Handed to every eval. `signal` aborts when the eval is superseded or the
 *  node is removed; `emit` pushes a value out of the node's "→" port and marks
 *  only downstream dirty (never the emitter itself). */
export interface NodeContext {
  signal: AbortSignal;
  emit(value: unknown): void;
}

/** A compiled code node, ready to run against resolved inputs. */
export type Executable = (
  inputs: Record<string, unknown>,
  ctx: NodeContext,
) => Promise<unknown>;

/** An adapter's way of saying "nothing runs here — show this instead"
 *  (js-module until the blob-URL adapter, py until the Pyodide kernel). */
export interface StaticResult {
  static: NodeResult;
}

/** Per-language adapter. One registered per Lang.
 *  FUTURE: marshal { toHost, fromHost, wrapFn, canTransfer } and typeSurface
 *  join when cross-language edges become real. */
export interface LanguageAdapter {
  /** Declared surface of the code: outputs drive live export handles. */
  inferInterface(code: string): InferredInterface;
  /** Compile into a runnable (may throw on syntax errors → error result),
   *  or declare the node static. */
  instantiate(code: string, inputNames: string[]): Executable | StaticResult;
}

/** Built-in node kinds (table, image, later canvas/tick/pointer) implement the
 *  same contract code nodes compile down to. */
export interface NodeDefinition {
  /** Fixed input ports (mirrors GraphNode.ins in the doc). */
  iface(n: GraphNode): { ins: string[] };
  create(): NodeInstance;
}

export interface NodeInstance {
  /** Runs when inputs change. A non-undefined return becomes the node's "→"
   *  value; undefined leaves the engine-held value (e.g. a sticky selection)
   *  untouched. */
  update(inputs: Record<string, unknown>, ctx: NodeContext): unknown | void;
  teardown?(): void;
}
