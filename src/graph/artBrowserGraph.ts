// Art browser example (natto's classic demo), grid-aligned:
//   artworks (fetch) ─→ table ─click→ image url ─→ image
// Everything runs through the real engine: the fetch node is a plain js-expr
// node whose ambient fetch is tied to the eval's lifecycle.

import type { Edge, NodeMap } from "../types";

export const ART_NODES: NodeMap = {
  arts: {
    id: "arts", lang: "js", name: "artworks", x: 54, y: 90, w: 324,
    code: `const r = await fetch("https://api.artic.edu/api/v1/artworks?fields=id,title,image_id,artist_title&limit=20")
const j = await r.json()
j.data`,
  },
  tbl: { id: "tbl", lang: "ui", name: "table", x: 432, y: 54, w: 342, kind: "table", ins: ["rows"] },
  url: {
    id: "url", lang: "js", name: "image url", x: 432, y: 396, w: 342,
    code: "artwork &&\n  `https://www.artic.edu/iiif/2/${artwork.image_id}/full/400,/0/default.jpg`",
  },
  img: { id: "img", lang: "ui", name: "image", x: 828, y: 90, w: 306, kind: "image", ins: ["url"] },
};

export const ART_EDGES: Edge[] = [
  { id: "a1", from: ["arts", "→"], to: ["tbl", "rows"], sample: "…first value pending" },
  { id: "a2", from: ["tbl", "→"], to: ["url", "artwork"], sample: "…click a row" },
  { id: "a3", from: ["url", "→"], to: ["img", "url"], sample: "…first value pending" },
];
