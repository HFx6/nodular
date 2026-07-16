// Engine boot: register the adapters and built-ins, then start the core.
// The core itself never imports adapters — registration is the only coupling.

import { registerAdapter, registerBuiltin } from "./core/registry";
import { startEngine } from "./core/engine";
import { jsAdapter } from "./adapters/js";
import { pyAdapter } from "./adapters/py";
import { canvasDef, imageDef, tableDef } from "./builtins";

export function bootEngine(): void {
  registerAdapter("js", jsAdapter);
  registerAdapter("py", pyAdapter);
  registerBuiltin("table", tableDef);
  registerBuiltin("image", imageDef);
  registerBuiltin("canvas", canvasDef);
  startEngine();
}
