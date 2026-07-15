// .nodular file export/import — plain JSON docs, no account needed
// (PROJECT.md: local-first, files export without an account).

import { clearHistory, useGraphStore, type GraphDoc } from "../graph/store";

const VERSION = 1;

export interface DocFile extends GraphDoc {
  version: number;
}

/** Light shape check — enough to reject corrupt/foreign JSON, not a schema. */
export function parseDoc(raw: unknown): GraphDoc | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Partial<DocFile>;
  if (typeof d.nodes !== "object" || d.nodes === null || !Array.isArray(d.edges)) return null;
  for (const [id, n] of Object.entries(d.nodes)) {
    if (!n || n.id !== id || typeof n.x !== "number" || typeof n.y !== "number" || typeof n.lang !== "string") return null;
  }
  for (const e of d.edges) {
    if (!e || typeof e.id !== "string" || !Array.isArray(e.from) || !Array.isArray(e.to)) return null;
  }
  return { nodes: d.nodes, edges: d.edges };
}

export function exportFile(name = "graph") {
  const { nodes, edges } = useGraphStore.getState();
  const blob = new Blob([JSON.stringify({ version: VERSION, nodes, edges }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.nodular`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Returns true when the file parsed and replaced the doc. */
export async function importFile(file: File): Promise<boolean> {
  try {
    const doc = parseDoc(JSON.parse(await file.text()));
    if (!doc) return false;
    useGraphStore.getState().setDoc(doc);
    clearHistory();
    return true;
  } catch {
    return false;
  }
}
