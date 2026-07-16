// The JS adapter. Natto's split, owned here and invisible to the core:
//   js-expr   — AsyncFunction compile for anything without module syntax;
//               bare expressions and statement bodies both work, and `await
//               fetch(...)` just works because the function is async.
//   js-module — code with import/export. v0 publishes a static "exports carry
//               the value" result; the blob-URL ES-module adapter replaces
//               exactly this branch later.

import { parse as acornParse } from "acorn";
import { init as lexInit, parse as lexParse } from "es-module-lexer";
import { inferJs } from "../inference/js";
import type { Executable, LanguageAdapter, StaticResult } from "../core/types";

let lexReady = false;
void lexInit.then(() => { lexReady = true; });

const MODULE_RE = /^\s*(import|export)\b/m;

function isModule(code: string): boolean {
  if (!lexReady) return MODULE_RE.test(code);
  try {
    const [imports, exports] = lexParse(code);
    return imports.length > 0 || exports.length > 0;
  } catch {
    return MODULE_RE.test(code); // mid-keystroke syntax error: cheap guess
  }
}

type Raw = (...args: unknown[]) => Promise<unknown>;

const AsyncFunction = Object.getPrototypeOf(async function () { /* probe */ })
  .constructor as new (...src: string[]) => Raw;

const cache = new Map<string, Raw>();

/** Compile cascade:
 *  1. `return (code)` — covers bare expressions, including await chains.
 *  2. Statement bodies: acorn finds the last top-level expression statement
 *     and a `return (…)` is spliced around it ("the last expression is the
 *     node's value"). No trailing expression → runs as-is, value undefined.
 *  Throws SyntaxError (acorn's, with position) for genuinely broken code. */
function compile(code: string, names: string[]): Raw {
  const key = names.join(",") + "\0" + code;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size > 200) cache.clear();
  let raw: Raw;
  try {
    raw = new AsyncFunction("fetch", ...names, `return (\n${code}\n);`);
  } catch {
    const prog = acornParse(code, { ecmaVersion: "latest", allowAwaitOutsideFunction: true });
    const last = prog.body[prog.body.length - 1];
    const body = last && last.type === "ExpressionStatement"
      ? code.slice(0, last.start) +
        `return (${code.slice(last.expression.start, last.expression.end)});` +
        code.slice(last.end)
      : code;
    raw = new AsyncFunction("fetch", ...names, body);
  }
  cache.set(key, raw);
  return raw;
}

/** Ambient fetch, tied to the eval's lifecycle: superseded evals cancel their
 *  in-flight requests (ENGINE.md's platform-services contract). */
function fetchWith(signal: AbortSignal): typeof fetch {
  return (input, init) =>
    fetch(input, {
      ...init,
      signal: init?.signal ? AbortSignal.any([signal, init.signal]) : signal,
    });
}

export const jsAdapter: LanguageAdapter = {
  inferInterface: inferJs,
  instantiate(code, inputNames): Executable | StaticResult {
    if (isModule(code)) {
      return { static: { v: null, why: "module — exports carry the value" } };
    }
    const raw = compile(code, inputNames);
    return (inputs, ctx) => raw(fetchWith(ctx.signal), ...inputNames.map((k) => inputs[k]));
  },
};
