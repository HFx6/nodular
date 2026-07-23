import { useEffect, useRef, useState } from "react";
import {
  IconChevronDown,
  IconFocusCentered,
  IconPlus,
} from "@tabler/icons-react";
import { SPAWN_KINDS, type SpawnKind } from "../graph/spawn";
import { Menu, type MenuActions } from "./Menu";

interface TopBarProps {
  zoom: number;
  /** filename of the doc currently on the board (#10) */
  doc: string;
  onAdd: (kind: SpawnKind) => void;
  onCenter: () => void;
  onZoomReset: () => void;
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
      if (root.current && !root.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="top-add">
      <span
        className="ctrl frow top-eval"
        title="add an eval node"
        onClick={() => onAdd("eval")}
      >
        <IconPlus size={13} stroke={1.75} />
        eval
      </span>
      <span
        className="ctrl frow"
        title="node palette"
        onClick={() => setOpen((o) => !o)}
      >
        <IconChevronDown size={13} stroke={1.75} />
      </span>
      {open && (
        <div className="popover top-pop">
          {SPAWN_KINDS.map(({ kind, label }) => (
            <div
              key={kind}
              className="popitem"
              onClick={() => {
                setOpen(false);
                onAdd(kind);
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Top bar — only things that do things. */
export function TopBar({
  zoom,
  doc,
  onAdd,
  onCenter,
  onZoomReset,
  menu,
}: TopBarProps) {
  return (
    <div className="topbar">
      <Menu {...menu} />
      <span className="top-brand">nodular</span>
      <span className="top-doc">{doc}</span>
      <AddButton onAdd={onAdd} />
      <span className="ctrl frow" title="center graph" onClick={onCenter}>
        <IconFocusCentered size={13} stroke={1.75} />
      </span>
      {/* the readout is the reset: clicking it returns the view to 100% (#12) */}
      <span
        className="top-zoom"
        title="reset zoom to 100%"
        onClick={onZoomReset}
      >
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
