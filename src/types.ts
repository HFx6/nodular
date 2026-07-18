// Shared domain types for the graph doc.
//
// Vocabulary note: the docs call these "nodes" (the graph is the module system).
// The DOM already owns the name `Node`, so the graph node type is `GraphNode`.

export type Lang = "js" | "py" | "ui" | "canvas";

/** UI built-in sub-kinds (sources, and fixed-input built-ins). */
export type UiKind =
  "tick" | "pointer" | "table" | "image" | "import" | "text" | "state";

/** js nodes: how the editor value compiles. undefined = auto (infer from syntax). */
export type ValueMode = "auto" | "expr" | "body" | "text";

/** Code nodes: how the node's value renders in the body. undefined = default result strip. */
export type RenderMode = "default" | "table" | "text" | "html";

export interface GraphNode {
  id: string;
  lang: Lang;
  name: string;
  x: number;
  y: number;
  w: number;
  /** fixed height from a user resize; undefined = auto (content-driven) */
  h?: number;
  code?: string;
  min?: boolean;
  manual?: boolean;
  /** ui nodes only */
  kind?: UiKind;
  /** pointer nodes only: the surface they read from */
  target?: string;
  /** import nodes only: emit module.default rather than the whole namespace */
  useDefault?: boolean;
  /** canvas nodes only: fallback display aspect (width/height) used when the
   *  renderer doesn't declare its own size. A renderer that draws at a fixed
   *  resolution sets it from code — `{ draw, width, height }` — so this is only
   *  a default for size-agnostic surfaces; undefined = 3:2. */
  aspect?: number;
  /** fixed input port names (canvas and fixed-input built-ins like table/image) */
  ins?: string[];
  /** fixed output port names for built-ins with named outputs (state's "set") */
  outs?: string[];
  /** js nodes: editor value compile mode (undefined = auto) */
  valueMode?: ValueMode;
  /** code nodes: body render mode (undefined = default result strip) */
  renderMode?: RenderMode;
  /** code nodes: editor/value split fraction 0..1 (editor share; undefined = ~0.5).
   *  0 = value-only pane, 1 = editor-only — the other region collapses. */
  split?: number;
}

export type NodeMap = Record<string, GraphNode>;

/** [nodeId, portName] — "→" is the node's own value port. */
export type PortRef = [string, string];

export interface Edge {
  id: string;
  from: PortRef;
  to: PortRef;
  stream?: boolean;
  xlang?: string;
}

export interface ExportInfo {
  name: string;
  fn: boolean;
}

/** Inferred value of a node: either a value with a kind, or nothing with a reason. */
export interface NodeResult {
  v: string | null;
  k?: string;
  why?: string;
}

export interface View {
  x: number;
  y: number;
  k: number;
}

export interface ArmState {
  id: string;
  port: string;
  /** live cursor position (board coords) while the wire is being dragged */
  drag?: { x: number; y: number } | null;
}
