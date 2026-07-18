export const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
/** self-hosted SF Pro (app/public/fonts — user-supplied, gitignored; see
 *  design.md). The tail is a load-failure guard, not a design fallback. */
export const SANS = "'SF Pro', ui-sans-serif, system-ui, sans-serif";
/** chrome-text tracking (cuelume): slightly negative so SF Pro at 10–13px
 *  doesn't run loose. Chrome/sans only — never applied to mono. */
export const TRACK = "-0.011em";
export const HEAD = 34;
export const ROW = 20;
/** corner radius of node cards, popovers and other paper chrome */
export const RADIUS = 3;
/** max auto-height of a node's code editor before it scrolls */
export const PANE_MAX_H = 280;
export const GRID = 18;
/** Zoom clamp. MIN = MAX / 4 on purpose: the dot grid's coarse LOD layer is
 *  4×GRID, so at full zoom-out the grid renders at exactly the same on-screen
 *  size as the fine grid at full zoom-in (#3). */
export const ZOOM_MAX = 2;
export const ZOOM_MIN = ZOOM_MAX / 8;

/** the only two elevations in the app (node cards, popovers) — neutral tint */
export const SHADOW = {
  card: "0 1px 4px rgba(0,0,0,.08)",
  pop: "0 4px 14px rgba(0,0,0,.12)",
} as const;
/** standard chrome easing (cuelume) */
export const EASE = "cubic-bezier(.2,0,0,1)";

export const C = {
  bg: "#f0f0ef",
  /** ruled-grid line color (name kept from the dot-grid era) */
  dot: "#e0e0df",
  pane: "#ffffff",
  edge: "#e2e2e1",
  headBg: "#fafafa",
  ink: "#232323",
  dim: "#8b8b8b",
  faint: "#bdbdbc",
  /** borderless header chips/buttons: a shade darker than headBg */
  chip: "#ededec",
  chipHot: "#e2e2e1",
  wire: "#a8a8a6",
  wireHot: "#4a4a48",
  /** port labels: darker than wires so they read over a passing wire (#4) */
  portLabel: "#565654",
  sel: "#4c7fae",
  selSoft: "rgba(76,127,174,.14)",
  bad: "#bb5147",
  badSoft: "#f7e9e7",
  kw: "#3d6a96",
  str: "#4e7d64",
  num: "#8a5a9e",
  run: "#57a37a",
  // extended syntax tags (#8) — same muted paper band as kw/str/num
  cmt: "#a3a29a",
  fn: "#8a6d3b",
  prop: "#59788e",
  typ: "#3d7a76",
  dark: "#242331",
  darkInk: "#c9c8d6",
  /** code-pane / value-face background: a hair brighter than pane */
  paneSoft: "#fcfcfa",
  /** light text on dark ink chips (board note, wire sample badge, kind tab) */
  inkInv: "#f5f5f4",
  /** hint text over the dark canvas surface */
  canvasHint: "#5b5877",
} as const;
