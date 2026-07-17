export const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
export const SANS = "ui-sans-serif, system-ui, sans-serif";
export const HEAD = 30;
export const ROW = 20;
export const GRID = 18;
/** Zoom clamp. MIN = MAX / 4 on purpose: the dot grid's coarse LOD layer is
 *  4×GRID, so at full zoom-out the grid renders at exactly the same on-screen
 *  size as the fine grid at full zoom-in (#3). */
export const ZOOM_MAX = 1.6;
export const ZOOM_MIN = ZOOM_MAX / 4;

export const C = {
  bg: "#e9e9e6", dot: "#d7d7d3",
  pane: "#ffffff", edge: "#d6d6d2", headBg: "#f6f6f4",
  ink: "#33322e", dim: "#8f8e88", faint: "#b9b8b2",
  wire: "#bdbcb6", wireHot: "#6d6c66",
  /** port labels: darker than wires so they read over a passing wire (#4) */
  portLabel: "#5f5e58",
  sel: "#4c7fae", selSoft: "rgba(76,127,174,.14)",
  bad: "#bb5147", badSoft: "#f7e9e7",
  kw: "#3d6a96", str: "#4e7d64", num: "#8a5a9e", run: "#57a37a",
  // extended syntax tags (#8) — same muted paper band as kw/str/num
  cmt: "#a3a29a", fn: "#8a6d3b", prop: "#59788e", typ: "#3d7a76",
  dark: "#242331", darkInk: "#c9c8d6",
} as const;
