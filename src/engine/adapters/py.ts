// The Python adapter, placeholder edition: the regex heuristics stand in until
// a Pyodide worker kernel implements instantiate for real. Uniform dispatch
// today (the core already speaks LanguageAdapter); only this file changes then.

import { inferPy, pyResult } from "../inference/py";
import type { LanguageAdapter } from "../core/types";

export const pyAdapter: LanguageAdapter = {
  inferInterface: inferPy,
  instantiate: (code) => ({ static: pyResult(code) }),
};
