// Adapter + built-in registries. Registration happens once at boot
// (engine/boot.ts); the core resolves nodes through here and stays agnostic.

import type { GraphNode, Lang, UiKind } from "../../types";
import type { LanguageAdapter, NodeDefinition } from "./types";

const adapters = new Map<Lang, LanguageAdapter>();
const builtins = new Map<string, NodeDefinition>();

export function registerAdapter(lang: Lang, adapter: LanguageAdapter): void {
  adapters.set(lang, adapter);
}

export function registerBuiltin(kind: UiKind | "canvas", def: NodeDefinition): void {
  builtins.set(kind, def);
}

export function adapterFor(lang: Lang): LanguageAdapter | undefined {
  return adapters.get(lang);
}

export type Resolution =
  | { kind: "code"; adapter: LanguageAdapter }
  | { kind: "builtin"; def: NodeDefinition };

/** Doc schema → contract mapping: ui nodes resolve by their UiKind, canvas by
 *  "canvas", code nodes by language adapter. Null = nothing registered — in v0
 *  tick/pointer/canvas stay on the staged walkers runtime and are skipped. */
export function resolve(n: GraphNode): Resolution | null {
  if (n.lang === "ui" || n.lang === "canvas") {
    const def = builtins.get(n.lang === "canvas" ? "canvas" : (n.kind ?? ""));
    return def ? { kind: "builtin", def } : null;
  }
  const adapter = adapters.get(n.lang);
  return adapter ? { kind: "code", adapter } : null;
}
