// The examples manifest — the one place that knows what demos exist. The menu
// renders this list; nothing else imports example graphs.
//
// Two sources:
//  - built-ins: lazy dynamic imports of the graph modules, so a big demo (the
//    NES doc embeds the whole emulator, ~90KB) never lands in the main bundle
//  - drop-ins: any `<name>.nodular.json` file in this folder is picked up by
//    the glob below and appears in the menu automatically. Produce one with
//    menu → "export .nodular" and drop it here.

import type { GraphDoc } from "../graph/store";
import { parseDoc } from "../persist/file";

export interface Example {
  id: string;
  /** menu label */
  name: string;
  /** toast shown after loading */
  toast: string;
  load: () => Promise<GraphDoc>;
}

const builtin: Example[] = [
  {
    id: "walkers", name: "walkers", toast: "loaded walkers",
    load: async () => {
      const m = await import("../graph/initialGraph");
      return { nodes: m.INITIAL_NODES, edges: m.INITIAL_EDGES };
    },
  },
  {
    id: "art", name: "art browser", toast: "loaded art browser — click a row",
    load: async () => {
      const m = await import("../graph/artBrowserGraph");
      return { nodes: m.ART_NODES, edges: m.ART_EDGES };
    },
  },
  {
    id: "nanoid", name: "npm import (nanoid)", toast: "loaded npm import — a random nanoid",
    load: async () => {
      const m = await import("../graph/nanoidGraph");
      return { nodes: m.NANOID_NODES, edges: m.NANOID_EDGES };
    },
  },
  {
    id: "nes", name: "NES emulator", toast: "loaded NES — click canvas, arrows + z/x + enter/space",
    load: async () => {
      const m = await import("../graph/nesGraph");
      return { nodes: m.NES_NODES, edges: m.NES_EDGES };
    },
  },
];

const dropIns = import.meta.glob<unknown>("./*.nodular.json", { import: "default" });

const fromJson: Example[] = Object.entries(dropIns).map(([path, load]) => {
  const id = path.replace(/^\.\//, "").replace(/\.nodular\.json$/, "");
  const name = id.replace(/[-_]/g, " ");
  return {
    id, name, toast: `loaded ${name}`,
    load: async () => {
      const doc = parseDoc(await load());
      if (!doc) throw new Error(`${id}.nodular.json is not a valid doc`);
      return doc;
    },
  };
});

export const EXAMPLES: Example[] = [...builtin, ...fromJson];
