// Thin adapter between the Zustand graph store and the component tree. Keeps
// the store UI-agnostic: toasts live here, not in mutations. Node cards get
// one stable NodeActions object so memoization holds.

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGraphStore } from "./store";

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

export function useGraph(notify: (m: string) => void) {
  const { nodes, edges, sel, arm } = useGraphStore(
    useShallow((s) => ({ nodes: s.nodes, edges: s.edges, sel: s.sel, arm: s.arm })),
  );

  const actions = useMemo<NodeActions>(() => {
    const st = () => useGraphStore.getState();
    return {
      onSelect: (id) => st().select(id, false),
      onDelete: (id) => st().deleteNodes([id]),
      onToggleMin: (id) => st().toggleMin(id),
      onToggleMode: (id) => st().toggleManual(id),
      onRunOnce: (id) => notify(`ran ${st().nodes[id]?.name}`),
      onArmOut: (id, port) => {
        st().armOut(id, port);
        notify(`connecting ${port === "→" ? id : port} — click a node's left edge`);
      },
      onDropIn: (id, port) => {
        const armed = st().arm;
        const r = st().dropIn(id, port);
        if (r.ok) notify(`${r.name} is now in scope`);
        else if (armed && armed.id === id) notify("not into itself");
      },
      onCodeChange: (id, code) => st().updateCode(id, code),
    };
  }, [notify]);

  // primary selection: last selected node that still exists; "" = nothing selected
  const primary = [...sel].reverse().find((id) => nodes[id]) ?? "";

  return { nodes, edges, sel, primary, arm, actions };
}
