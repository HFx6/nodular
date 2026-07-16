import { useEffect, useRef, useState } from "react";
import { C, MONO } from "../theme";
import { SPAWN_KINDS, type SpawnKind } from "../graph/spawn";
import { Menu, type MenuActions } from "./Menu";

interface TopBarProps {
  zoom: number;
  onAdd: (kind: SpawnKind) => void;
  menu: MenuActions;
}

/** natto-style split button: click the label to add an eval node, click the
 *  ▾ for the full node-type palette. Closes on pick, click-outside, Escape. */
function AddButton({ onAdd }: { onAdd: (kind: SpawnKind) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const half = { fontFamily: MONO, fontSize: 11.5, padding: "3px 8px", border: `1px solid ${C.edge}`, background: C.pane, color: C.ink, cursor: "pointer" } as const;
  return (
    <div ref={root} style={{ position: "relative", marginLeft: "auto", display: "flex" }}>
      <button onClick={() => onAdd("eval")} style={{ ...half, borderRadius: "4px 0 0 4px", padding: "3px 10px" }}>+ eval</button>
      <button onClick={() => setOpen((o) => !o)} style={{ ...half, borderRadius: "0 4px 4px 0", borderLeft: "none", padding: "3px 6px" }}>▾</button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 7px)", right: 0, minWidth: 150, zIndex: 20,
          background: C.pane, border: `1px solid ${C.edge}`, borderRadius: 4, boxShadow: "0 4px 14px rgba(40,40,36,.12)", padding: "5px 0" }}>
          {SPAWN_KINDS.map(({ kind, label }) => (
            <div key={kind} onClick={() => { setOpen(false); onAdd(kind); }}
              style={{ padding: "5px 12px", fontFamily: MONO, fontSize: 11.5, color: C.ink, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.headBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Top bar — only things that do things. */
export function TopBar({ zoom, onAdd, menu }: TopBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 14px", borderBottom: `1px solid ${C.edge}`, background: C.pane }}>
      <Menu {...menu} />
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>nodular</span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.dim }}>walkers.nodular</span>
      <AddButton onAdd={onAdd} />
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{Math.round(zoom * 100)}%</span>
    </div>
  );
}
