// The JS adapter. Natto's split, owned here and invisible to the core:
//   js-expr   — AsyncFunction compile for anything without module syntax;
//               bare expressions and statement bodies both work, and `await
//               fetch(...)` just works because the function is async.
//   js-module — code with static import/export. Compiled to a blob-URL ES
//               module and import()ed; named exports become the node's port
//               values, `export default` feeds "→" (unwrapped generically in
//               the core). "Edges are the imports": wired inputs are injected
//               as top-level bindings via a globalThis handshake, never as
//               user-written imports. Bare npm specifiers are rewritten to
//               esm.sh in place.

import { parse as acornParse } from "acorn";
import { init as lexInit, parse as lexParse } from "es-module-lexer";
import { inferJs } from "../inference/js";
import type { ValueMode } from "../../types";
import type { Executable, LanguageAdapter, StaticResult } from "../core/types";

let lexReady = false;
void lexInit.then(() => { lexReady = true; });

const MODULE_RE = /^\s*(import|export)\b/m;

/** Module syntax = a *static* import or any export. Dynamic `import()` (d >= 0)
 *  does not count — a natto-style `await import("https://esm.sh/x")` expression
 *  belongs on the AsyncFunction expr path, which handles it natively. */
function isModule(code: string): boolean {
  if (!lexReady) return MODULE_RE.test(code);
  try {
    const [imports, exports] = lexParse(code);
    return imports.some((i) => i.d === -1) || exports.length > 0;
  } catch {
    return MODULE_RE.test(code); // mid-keystroke syntax error: cheap guess
  }
}

/** Injected-input handoff: blob modules can't close over JS values, so the
 *  generated prelude reads wired inputs from this global map by a per-eval key. */
const moduleInputs = new Map<string, Record<string, unknown>>();
(globalThis as unknown as { __nodularInputs?: typeof moduleInputs }).__nodularInputs = moduleInputs;
let instSeq = 0;

/** Rewrite bare npm specifiers to esm.sh in place, reusing es-module-lexer's
 *  specifier ranges (no re-parse). URL and relative specifiers pass through —
 *  a relative specifier is meaningless in a blob and surfaces the browser's
 *  resolution error on the node. Right-to-left so earlier offsets stay valid. */
function rewriteSpecifiers(code: string): string {
  if (!lexReady) return code;
  let imports: ReturnType<typeof lexParse>[0];
  try {
    imports = lexParse(code)[0];
  } catch {
    return code; // mid-keystroke: import raw, let the browser report
  }
  let out = code;
  for (let k = imports.length - 1; k >= 0; k--) {
    const im = imports[k]!;
    if (im.d !== -1) continue; // dynamic import: leave the author's URL alone
    const spec = im.n;
    if (!spec) continue;
    const bare = !/^\.|^\//.test(spec) && !/^[a-zA-Z][\w+.-]*:/.test(spec);
    if (!bare) continue;
    out = out.slice(0, im.s) + "https://esm.sh/" + spec + out.slice(im.e);
  }
  return out;
}

/** Build the module Executable. A fresh blob is created and import()ed on every
 *  eval (the accepted cost of the two-adapter split, per ENGINE.md). Module-scope
 *  `let` state therefore resets whenever this node re-instantiates (code or input
 *  change); it survives *downstream* re-evals only because the engine memoizes the
 *  resolved namespace as the node's value and doesn't re-import an unchanged node. */
function moduleExecutable(code: string, inputNames: string[]): Executable {
  // No ctx needed: a blob import has nothing to abort, and the engine's epoch
  // guard already discards a superseded eval's resolved value.
  return async (inputs) => {
    const key = `m${instSeq++}`;
    const decl = inputNames.length
      ? `const { ${inputNames.join(", ")} } = globalThis.__nodularInputs.get(${JSON.stringify(key)});\n`
      : "";
    const source = decl + rewriteSpecifiers(code);
    moduleInputs.set(key, inputs);
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    try {
      return await import(/* @vite-ignore */ url);
    } finally {
      URL.revokeObjectURL(url);
      moduleInputs.delete(key);
    }
  };
}

type Raw = (...args: unknown[]) => Promise<unknown>;

const AsyncFunction = Object.getPrototypeOf(async function () { /* probe */ })
  .constructor as new (...src: string[]) => Raw;

const cache = new Map<string, Raw>();

/** All blank / comment-only lines: compiles to a bare `return` so an empty
 *  node yields undefined instead of a `return ()` syntax error (natto's
 *  isEmptyEvalExpression). */
function isEmptyExpr(code: string): boolean {
  return code.split("\n").every((line) => {
    const t = line.trim();
    return t === "" || t.startsWith("//");
  });
}

/** Compile per editor-value mode:
 *  - expr: `return (code)` only — a SyntaxError is the node's error.
 *  - body: the code verbatim; the user writes the return statement.
 *  - auto: expr wrap first, then the acorn cascade — the last top-level
 *    expression statement gets a `return (…)` spliced around it ("the last
 *    expression is the node's value"). No trailing expression → runs as-is,
 *    value undefined. Throws SyntaxError (acorn's, with position) for
 *    genuinely broken code. */
function compile(code: string, names: string[], mode?: ValueMode): Raw {
  const key = (mode ?? "auto") + "\0" + names.join(",") + "\0" + code;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size > 200) cache.clear();
  let raw: Raw;
  if (mode === "body") {
    raw = new AsyncFunction("fetch", ...names, code);
  } else if (isEmptyExpr(code)) {
    raw = new AsyncFunction("fetch", ...names, "return;");
  } else if (mode === "expr") {
    raw = new AsyncFunction("fetch", ...names, `return (\n${code}\n);`);
  } else {
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
  instantiate(code, inputNames, mode): Executable | StaticResult {
    // text mode: the editor value IS the value — checked before isModule so
    // prose containing the word "import" never hits the module path.
    if (mode === "text") return async () => code;
    // an explicit expr/body mode pins the AsyncFunction path; module syntax
    // in those modes surfaces as its SyntaxError rather than silently rerouting
    if ((mode === undefined || mode === "auto") && isModule(code)) {
      return moduleExecutable(code, inputNames);
    }
    const raw = compile(code, inputNames, mode);
    return (inputs, ctx) => raw(fetchWith(ctx.signal), ...inputNames.map((k) => inputs[k]));
  },
};
