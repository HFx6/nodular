// JS inference via es-module-lexer (ENGINE.md's decided library): microsecond
// export scans on keystroke. The lexer's WASM init is fired at module load;
// until it resolves, the old regex scan answers so handles are correct from
// the first frame either way.

import { init, parse } from "es-module-lexer";
import type { ExportInfo } from "../../types";
import type { InferredInterface } from "./types";

let ready = false;
void init.then(() => {
  ready = true;
});

export function jsExportsRegex(code: string): ExportInfo[] {
  const out: ExportInfo[] = [];
  let m: RegExpExecArray | null;
  const re =
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = re.exec(code)))
    out.push({ name: m[1] ?? m[2] ?? "", fn: !!m[1] });
  return out;
}

/** Is the export at declaration offset `s` a function? Look at the text
 *  following the export's local name binding for a function-shaped declaration. */
function isFnExport(code: string, name: string, ls: number): boolean {
  // walk back from the local-name offset to the start of the declaration
  const before = code.slice(Math.max(0, ls - 40), ls);
  return (
    /(?:^|\s)(?:async\s+)?function\s*(?:\*\s*)?$/.test(before) ||
    // arrow/function expressions assigned to the binding: `export const f = (…) =>` / `= function`
    (/(?:const|let|var)\s+$/.test(before) &&
      /^\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|^\s*=\s*(?:async\s+)?function/.test(
        code.slice(ls + name.length),
      ))
  );
}

export function inferJs(code: string): InferredInterface {
  if (!ready) return { outputs: jsExportsRegex(code), freeInputs: [] };
  const [, exports] = parse(code); // throws on syntax error → caller keeps last good
  const outputs: ExportInfo[] = exports
    .filter((e) => e.n !== "default")
    .map((e) => ({
      name: e.n,
      fn: isFnExport(code, e.ln ?? e.n, e.ls >= 0 ? e.ls : e.s),
    }));
  return { outputs, freeInputs: [] };
}
