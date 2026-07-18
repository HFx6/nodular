// Python inference — fake regex scans, real enough to feel, until a Pyodide
// kernel runs ast.parse behind the same InferFn shape.

import type { ExportInfo, NodeResult } from "../../types";
import type { InferredInterface } from "./types";

export function pyDefs(code: string): ExportInfo[] {
  const out: ExportInfo[] = [];
  let m: RegExpExecArray | null;
  const re = /^def\s+([A-Za-z_]\w*)/gm;
  while ((m = re.exec(code))) out.push({ name: m[1] ?? "", fn: true });
  return out;
}

export function inferPy(code: string): InferredInterface {
  return { outputs: pyDefs(code), freeInputs: [] };
}

/** "Last expression is the value" convention, approximated. */
export function pyResult(code: string): NodeResult {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("import"));
  if (!lines.length) return { v: null, why: "empty" };
  const last = lines[lines.length - 1]!;
  const def = last.match(/^def\s+([A-Za-z_]\w*)/);
  if (def || /^\s/.test(code.split("\n").filter(Boolean).slice(-1)[0] || ""))
    return { v: null, why: `module of defs` };
  if (/^[A-Za-z_]\w*\s*=/.test(last))
    return { v: null, why: `last line assigns ${last.split("=")[0]!.trim()}` };
  if (/^-?\d+(\.\d+)?$/.test(last)) return { v: last, k: "num" };
  const env: Record<string, string> = {};
  for (const l of lines) {
    const a = l.match(/^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)$/);
    if (a) env[a[1]!] = a[2]!;
  }
  if (env[last] != null) return { v: env[last]!, k: "num" };
  return { v: "…", k: "expr" };
}
