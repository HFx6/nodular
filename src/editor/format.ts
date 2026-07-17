// Prettier formatting for js nodes. The standalone bundle (~200KB gz) is
// dynamic-imported so it costs nothing until the first format — Vite splits it
// into its own chunk. Python has no browser-sized formatter; py returns null.

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
