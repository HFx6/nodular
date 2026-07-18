import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { C, MONO } from "../theme";
import { SPAWN_KINDS, type SpawnKind } from "../graph/spawn";
import { Menu, type MenuActions } from "./Menu";

interface TopBarProps {
  zoom: number;
  onAdd: (kind: SpawnKind) => void;
  menu: MenuActions;
}

/** natto-style split control: click the label to add an eval node, click the
 *  chevron for the full node-type palette. Flat like every other toolbar
 *  affordance (.ctrl); closes on pick, click-outside, Escape. */
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

  return (
    <div ref={root} style={{ position: "relative", marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
      <span className="ctrl" title="add an eval node" onClick={() => onAdd("eval")}
        style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: MONO, fontSize: 11.5 }}>
        <IconPlus size={13} stroke={1.75} />eval
      </span>
      <span className="ctrl" title="node palette" onClick={() => setOpen((o) => !o)} style={{ display: "flex" }}>
        <IconChevronDown size={13} stroke={1.75} />
      </span>
      {open && (
        <div className="popover" style={{ top: "calc(100% + 9px)", right: -8, minWidth: 150, padding: "5px 0" }}>
          {SPAWN_KINDS.map(({ kind, label }) => (
            <div key={kind} className="popitem" onClick={() => { setOpen(false); onAdd(kind); }}>{label}</div>
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
