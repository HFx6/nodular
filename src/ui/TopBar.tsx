import { C, MONO } from "../theme";

interface TopBarProps {
  zoom: number;
  onAddNode: () => void;
}

/** Top bar — only things that do things. */
export function TopBar({ zoom, onAddNode }: TopBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 14px", borderBottom: `1px solid ${C.edge}`, background: C.pane }}>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>nodular</span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.dim }}>walkers.nodular</span>
      <button onClick={onAddNode}
        style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11.5, padding: "3px 10px", borderRadius: 4, border: `1px solid ${C.edge}`, background: C.pane, color: C.ink, cursor: "pointer" }}>+ node</button>
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{Math.round(zoom * 100)}%</span>
    </div>
  );
}
