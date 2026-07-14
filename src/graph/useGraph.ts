// The graph doc + its mutations, as a hook. This is the single seam the real
// engine plugs into: ENGINE.md specifies a Zustand store here with runtime
// state owned outside React. Keeping it behind one hook with stable actions
// means swapping useState → Zustand later touches only this file.

import { useCallback, useMemo, useState } from "react";
import { GRID } from "../theme";
import type { ArmState, Edge, NodeMap } from "../types";
import { INITIAL_EDGES, INITIAL_NODES } from "./initialGraph";

/** Actions a node card can invoke. Stable identities so nodes memoize cleanly. */
export interface NodeActions {
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleMin: (id: string) => void;
  onToggleMode: (id: string) => void;
  onRunOnce: (id: string) => void;
  onArmOut: (id: string, port: string) => void;
  onDropIn: (id: string, port: string | null) => void;
  onCodeChange: (id: string, code: string) => void;
}

const rid = (p: string) => p + Math.random().toString(36).slice(2, 6);

export function useGraph(notify: (m: string) => void) {
  const [nodes, setNodes] = useState<NodeMap>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [sel, setSel] = useState("count");
  const [arm, setArm] = useState<ArmState | null>(null);

  const updateCode = useCallback((id: string, code: string) =>
    setNodes((ns) => ({ ...ns, [id]: { ...ns[id]!, code } })), []);

  const moveNode = useCallback((id: string, x: number, y: number) =>
    setNodes((ns) => (ns[id]!.x === x && ns[id]!.y === y ? ns : { ...ns, [id]: { ...ns[id]!, x, y } })), []);

  const addNode = useCallback(() => {
    const id = rid("n");
    setNodes((ns) => ({ ...ns, [id]: { id, lang: "js", name: id, x: 54 + GRID * 2, y: 54 + GRID * 2, w: 204, edit: true, code: `1 + 1` } }));
    setSel(id); notify("new node — start typing");
  }, [notify]);

  const disarm = useCallback(() => setArm(null), []);

  const actions = useMemo<NodeActions>(() => ({
    onSelect: setSel,
    onDelete: (id) => {
      setNodes((ns) => { const n = { ...ns }; delete n[id]; return n; });
      setEdges((es) => es.filter((x) => x.from[0] !== id && x.to[0] !== id));
      setSel((cur) => (cur === id ? "" : cur));
    },
    onToggleMin: (id) => setNodes((ns) => ({ ...ns, [id]: { ...ns[id]!, min: !ns[id]!.min } })),
    onToggleMode: (id) => setNodes((ns) => ({ ...ns, [id]: { ...ns[id]!, manual: !ns[id]!.manual } })),
    onRunOnce: (id) => setNodes((ns) => { notify(`ran ${ns[id]?.name}`); return ns; }),
    onArmOut: (id, port) => { setArm({ id, port }); notify(`connecting ${port === "→" ? id : port} — click a node's left edge`); },
    onDropIn: (id, port) => {
      setArm((a) => {
        if (!a) return a;
        if (a.id === id) { notify("not into itself"); return null; }
        const name = port || (a.port === "→" ? a.id : a.port);
        setEdges((es) => [...es.filter((x) => !(x.to[0] === id && x.to[1] === name)),
          { id: rid("e"), from: [a.id, a.port], to: [id, name], sample: "…first value pending" }]);
        notify(`${name} is now in scope`);
        return null;
      });
    },
    onCodeChange: updateCode,
  }), [notify, updateCode]);

  // `sel` may point at a deleted node; fall back to the first remaining node.
  const selId = nodes[sel] ? sel : Object.keys(nodes)[0] ?? "";

  return { nodes, edges, sel: selId, arm, actions, addNode, moveNode, disarm, updateCode };
}
