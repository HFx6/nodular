// Fake inference — real enough to feel. Scans node code for exports/defs and
// evaluates the "last expression is the value" convention.
//
// This is the seed of the real per-language LanguageAdapter.inferInterface
// (ENGINE.md): swap these regex scans for es-module-lexer / ast.parse per
// language behind the same shape.

import type { ExportInfo, NodeResult } from "../types";

export function jsExports(code: string): ExportInfo[] {
  const out: ExportInfo[] = [];
  let m: RegExpExecArray | null;
  const re = /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = re.exec(code))) out.push({ name: m[1] ?? m[2] ?? "", fn: !!m[1] });
  return out;
}

export function pyDefs(code: string): ExportInfo[] {
  const out: ExportInfo[] = [];
  let m: RegExpExecArray | null;
  const re = /^def\s+([A-Za-z_]\w*)/gm;
  while ((m = re.exec(code))) out.push({ name: m[1] ?? "", fn: true });
  return out;
}

export function pyResult(code: string): NodeResult {
  const lines = code.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.startsWith("import"));
  if (!lines.length) return { v: null, why: "empty" };
  const last = lines[lines.length - 1]!;
  const def = last.match(/^def\s+([A-Za-z_]\w*)/);
  if (def || /^\s/.test(code.split("\n").filter(Boolean).slice(-1)[0] || "")) return { v: null, why: `module of defs` };
  if (/^[A-Za-z_]\w*\s*=/.test(last)) return { v: null, why: `last line assigns ${last.split("=")[0]!.trim()}` };
  if (/^-?\d+(\.\d+)?$/.test(last)) return { v: last, k: "num" };
  const env: Record<string, string> = {};
  for (const l of lines) { const a = l.match(/^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)$/); if (a) env[a[1]!] = a[2]!; }
  if (env[last] != null) return { v: env[last]!, k: "num" };
  return { v: "…", k: "expr" };
}
