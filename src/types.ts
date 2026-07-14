// Shared domain types for the graph doc.
//
// Vocabulary note: the docs call these "nodes" (the graph is the module system).
// The DOM already owns the name `Node`, so the graph node type is `GraphNode`.

export type Lang = "js" | "py" | "ui" | "canvas";

/** UI built-in sub-kinds (source built-ins). */
export type UiKind = "tick" | "pointer";

export interface GraphNode {
  id: string;
  lang: Lang;
  name: string;
  x: number;
  y: number;
  w: number;
  code?: string;
  edit?: boolean;
  running?: boolean;
  min?: boolean;
  manual?: boolean;
  /** ui nodes only */
  kind?: UiKind;
  /** pointer nodes only: the surface they read from */
  target?: string;
  /** canvas nodes only: fixed input port names */
  ins?: string[];
}

export type NodeMap = Record<string, GraphNode>;

/** [nodeId, portName] — "→" is the node's own value port. */
export type PortRef = [string, string];

export interface Edge {
  id: string;
  from: PortRef;
  to: PortRef;
  sample: string;
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
}

/** Mutable runtime state shared with the canvas surface, owned outside React. */
export interface LiveState {
  count: number;
  rendered: boolean;
  cursor: { x: number; y: number } | null;
  t: number;
}
