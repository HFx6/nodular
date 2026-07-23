// The examples manifest — the one place that knows what demos exist. The menu
// renders this list; nothing else imports example graphs.
//
// Every `<name>.nodular.json` file in this folder is picked up by the glob
// below and appears in the menu automatically — produce one with menu →
// "export .nodular" and drop it here. Files are lazy-imported, so a big demo
// (the NES doc embeds the whole emulator, ~160KB) never lands in the main
// bundle. META adds a friendlier label/toast than the filename default.

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

const META: Record<string, { name?: string; toast?: string; order?: number }> =
  {
    walkers: { order: 0 },
    "art-browser": { order: 1, toast: "loaded art browser — click a row" },
    nanoid: {
      order: 2,
      name: "npm import (nanoid)",
      toast: "loaded npm import — a random nanoid",
    },
    nes: {
      order: 3,
      name: "NES emulator",
      toast: "loaded NES — click canvas, arrows + z/x + enter/space",
    },
    gba: {
      order: 4,
      name: "GBA emulator",
      toast: "loaded GBA — 16MB ROM fetch, then arrows + z/x + a/s + enter",
    },
    "block-cipher": {
      order: 5,
      name: "block cipher (AES-PCBC)",
      toast: "loaded PCBC — every block, ⊕, and cipher box is a node",
    },
    weather: {
      order: 6,
      name: "weather dashboard",
      toast: "loaded weather — type a city, click a day",
    },
    github: {
      order: 7,
      name: "GitHub repo explorer",
      toast: "loaded GitHub — type owner/repo, click a contributor",
    },
    "tone-synth": {
      order: 8,
      name: "Tone.js synth",
      toast: "loaded synth — play a–k, sharps on w e t y u",
    },
  };

const dropIns = import.meta.glob<unknown>("./*.nodular.json", {
  import: "default",
});

export const EXAMPLES: Example[] = Object.entries(dropIns)
  .map(([path, load]) => {
    const id = path.replace(/^\.\//, "").replace(/\.nodular\.json$/, "");
    const name = META[id]?.name ?? id.replace(/[-_]/g, " ");
    return {
      id,
      name,
      toast: META[id]?.toast ?? `loaded ${name}`,
      load: async () => {
        const doc = parseDoc(await load());
        if (!doc) throw new Error(`${id}.nodular.json is not a valid doc`);
        return doc;
      },
    };
  })
  .sort((a, b) => (META[a.id]?.order ?? 99) - (META[b.id]?.order ?? 99));
