// The graph doc as a Zustand store (ENGINE.md: Zustand for the doc, runtime
// state outside React). Undo history via zundo covers ONLY the document
// (nodes + edges) — selection, arming, and the view transform are ephemeral.
//
// History granularity: rapid mutations coalesce into one entry (a typing burst
// = one undo step); drags pause history and commit once on release.

import { create } from "zustand";
import { temporal } from "zundo";
import type { ArmState, Edge, NodeMap, PortRef } from "../types";
import { GRID } from "../theme";
import { newId } from "./ids";
import { INITIAL_EDGES, INITIAL_NODES } from "./initialGraph";

export interface GraphDoc {
  nodes: NodeMap;
  edges: Edge[];
}

export interface DropResult {
  ok: boolean;
  /** the input-port name that was bound (when ok) */
  name?: string;
}

export interface GraphStore extends GraphDoc {
  // ephemeral UI state — excluded from history via partialize
  /** ordered selection; last element is the primary node */
  sel: string[];
  arm: ArmState | null;

  // document mutations (tracked in history)
  updateCode: (id: string, code: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  moveNodes: (entries: Array<{ id: string; x: number; y: number }>) => void;
  addNode: (at: { x: number; y: number }) => string;
  resizeNode: (id: string, w: number, h?: number) => void;
  deleteNodes: (ids: string[]) => void;
  toggleMin: (id: string) => void;
  toggleManual: (id: string) => void;
  connect: (from: PortRef, to: PortRef) => void;
  setDoc: (doc: GraphDoc) => void;

  // selection / arming (ephemeral)
  select: (id: string, additive: boolean) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  armOut: (id: string, port: string) => void;
  /** completes the armed connection into node `id`; null port = new input named after the source */
  dropIn: (id: string, port: string | null) => DropResult;
  disarm: () => void;
  setArmDrag: (p: { x: number; y: number } | null) => void;
}

/** Leading-edge coalescing: the first change of a burst snapshots history;
 *  further changes within `ms` of quiet extend the same entry. */
function coalesce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let quiet: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (quiet === undefined) fn(...args);
    else clearTimeout(quiet);
    quiet = setTimeout(() => (quiet = undefined), ms);
  };
}

export const useGraphStore = create<GraphStore>()(
  temporal(
    (set, get) => ({
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      sel: ["count"],
      arm: null,

      updateCode: (id, code) =>
        set((s) => (s.nodes[id] && s.nodes[id].code !== code
          ? { nodes: { ...s.nodes, [id]: { ...s.nodes[id]!, code } } }
          : s)),

      moveNode: (id, x, y) =>
        set((s) => (s.nodes[id] && (s.nodes[id].x !== x || s.nodes[id].y !== y)
          ? { nodes: { ...s.nodes, [id]: { ...s.nodes[id]!, x, y } } }
          : s)),

      moveNodes: (entries) =>
        set((s) => {
          let changed = false;
          const nodes = { ...s.nodes };
          for (const { id, x, y } of entries) {
            const n = nodes[id];
            if (n && (n.x !== x || n.y !== y)) { nodes[id] = { ...n, x, y }; changed = true; }
          }
          return changed ? { nodes } : s;
        }),

      addNode: (at) => {
        const id = newId("n");
        const x = Math.round(at.x / GRID) * GRID;
        const y = Math.round(at.y / GRID) * GRID;
        set((s) => ({
          nodes: { ...s.nodes, [id]: { id, lang: "js" as const, name: id, x, y, w: 204, code: `1 + 1` } },
          sel: [id],
        }));
        return id;
      },

      resizeNode: (id, w, h) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n || (n.w === w && n.h === h)) return s;
          return { nodes: { ...s.nodes, [id]: { ...n, w, ...(h !== undefined ? { h } : {}) } } };
        }),

      deleteNodes: (ids) => {
        if (!ids.length) return;
        const gone = new Set(ids);
        set((s) => {
          const nodes = { ...s.nodes };
          for (const id of ids) delete nodes[id];
          return {
            nodes,
            edges: s.edges.filter((e) => !gone.has(e.from[0]) && !gone.has(e.to[0])),
            sel: s.sel.filter((id) => !gone.has(id)),
            arm: s.arm && gone.has(s.arm.id) ? null : s.arm,
          };
        });
      },

      toggleMin: (id) =>
        set((s) => (s.nodes[id] ? { nodes: { ...s.nodes, [id]: { ...s.nodes[id]!, min: !s.nodes[id]!.min } } } : s)),

      toggleManual: (id) =>
        set((s) => (s.nodes[id] ? { nodes: { ...s.nodes, [id]: { ...s.nodes[id]!, manual: !s.nodes[id]!.manual } } } : s)),

      connect: (from, to) =>
        set((s) => ({
          edges: [...s.edges.filter((x) => !(x.to[0] === to[0] && x.to[1] === to[1])),
            { id: newId("e"), from, to, sample: "…first value pending" }],
        })),

      setDoc: (doc) => set({ nodes: doc.nodes, edges: doc.edges, sel: [], arm: null }),

      select: (id, additive) =>
        set((s) => additive
          ? { sel: s.sel.includes(id) ? s.sel.filter((x) => x !== id) : [...s.sel, id] }
          : { sel: [id] }),
      setSelection: (ids) => set({ sel: ids }),
      clearSelection: () => set({ sel: [] }),

      armOut: (id, port) => set({ arm: { id, port } }),
      dropIn: (id, port) => {
        const a = get().arm;
        if (!a) return { ok: false };
        if (a.id === id) { set({ arm: null }); return { ok: false }; }
        const name = port || (a.port === "→" ? a.id : a.port);
        get().connect([a.id, a.port], [id, name]);
        set({ arm: null });
        return { ok: true, name };
      },
      disarm: () => set({ arm: null }),
      setArmDrag: (p) => set((s) => (s.arm ? { arm: { ...s.arm, drag: p } } : s)),
    }),
    {
      partialize: (s) => ({ nodes: s.nodes, edges: s.edges }),
      limit: 100,
      equality: (a, b) => a.nodes === b.nodes && a.edges === b.edges,
      handleSet: (handleSet) => coalesce(handleSet, 350),
    },
  ),
);

// Plain-function history controls for keyboard handlers and drag lifecycles.
export const undo = () => useGraphStore.temporal.getState().undo();
export const redo = () => useGraphStore.temporal.getState().redo();
export const pauseHistory = () => useGraphStore.temporal.getState().pause();
export const resumeHistory = () => useGraphStore.temporal.getState().resume();
export const clearHistory = () => useGraphStore.temporal.getState().clear();
