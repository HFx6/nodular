// Prettier formatting for js nodes. The standalone bundle (~200KB gz) is
// dynamic-imported so it costs nothing until the first format — Vite splits it
// into its own chunk. Python has no browser-sized formatter; py returns null.

import type { GraphDoc } from "../graph/store";

export async function formatCode(lang: string, src: string): Promise<string | null> {
  if (lang !== "js") return null;
  const [prettier, babel, estree] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
  ]);
  try {
    const out = await prettier.format(src, {
      parser: "babel",
      plugins: [babel.default, estree.default],
      printWidth: 72, // nodes and the rail are narrow
    });
    return out.replace(/\n$/, "");
  } catch {
    return null; // unparseable code — the linter is already pointing at why
  }
}

/** Prettify every js node's code, returning a new doc (used when an example or
 *  the seed graph loads, so demos land cleanly formatted). Unparseable or
 *  non-js nodes pass through unchanged. */
export async function formatDoc(doc: GraphDoc): Promise<GraphDoc> {
  const entries = await Promise.all(
    Object.entries(doc.nodes).map(async ([id, n]) => {
      if (n.code) {
        const out = await formatCode(n.lang, n.code);
        if (out != null && out !== n.code) return [id, { ...n, code: out }] as const;
      }
      return [id, n] as const;
    }),
  );
  return { nodes: Object.fromEntries(entries), edges: doc.edges };
}
