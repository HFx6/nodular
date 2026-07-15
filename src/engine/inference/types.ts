// The per-language inference contract. Mirrors the return shape of
// LanguageAdapter.inferInterface (ENGINE.md) so real adapters slot in behind
// the same seam: outputs drive the live export handles, freeInputs will later
// drive unresolved-name quick-fixes (unused for now, always []).

import type { ExportInfo } from "../../types";

export interface InferredInterface {
  outputs: ExportInfo[];
  freeInputs: string[];
}

/** Parse code into its declared surface. Throws on a parse error — callers
 *  keep the last good result so mid-keystroke syntax errors never flicker. */
export type InferFn = (code: string) => InferredInterface;
