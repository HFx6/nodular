// natto-style top menu: file ops, examples, view, help. Paper-styled dropdown,
// closes on click-outside, Escape, or after an action.

import { useEffect, useRef, useState } from "react";
import { C, MONO } from "../theme";

export interface MenuActions {
  onReset: () => void;
  onLoadWalkers: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onZoomReset: () => void;
  onToggleRail: () => void;
}

const SHORTCUTS: Array<[string, string]> = [
  ["drag", "select"],
  ["middle-drag", "pan"],
  ["scroll / pinch", "zoom"],
  ["ctrl+z / ctrl+y", "undo / redo"],
  ["ctrl+s", "export .nodular"],
  ["delete", "remove selection"],
  ["shift+click", "add to selection"],
  ["esc", "cancel / deselect"],
];

function Item({ label, onPick }: { label: string; onPick: () => void }) {
  return (
    <div onClick={onPick}
      style={{ padding: "5px 12px", fontFamily: MONO, fontSize: 11.5, color: C.ink, cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.headBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      {label}
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div style={{ padding: "7px 12px 3px", fontFamily: MONO, fontSize: 9.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".06em" }}>
      {title}
    </div>
  );
}

export function Menu(actions: MenuActions) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const pick = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <div ref={root} style={{ position: "relative" }}>
      <span className="ctrl" style={{ fontSize: 13, letterSpacing: "1px" }} onClick={() => setOpen((o) => !o)}>≡</span>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 9px)", left: -8, minWidth: 190, zIndex: 20,
          background: C.pane, border: `1px solid ${C.edge}`, borderRadius: 4, boxShadow: "0 4px 14px rgba(40,40,36,.12)", paddingBottom: 6 }}>
          <Section title="file" />
          <Item label="reset canvas" onPick={pick(actions.onReset)} />
          <Item label="export .nodular" onPick={pick(actions.onExport)} />
          <Item label="import…" onPick={() => fileInput.current?.click()} />
          <Section title="examples" />
          <Item label="walkers" onPick={pick(actions.onLoadWalkers)} />
          <Section title="view" />
          <Item label="zoom 100%" onPick={pick(actions.onZoomReset)} />
          <Item label="toggle editor rail" onPick={pick(actions.onToggleRail)} />
          <Section title="shortcuts" />
          <div style={{ padding: "2px 12px 4px" }}>
            {SHORTCUTS.map(([k, what]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: MONO, fontSize: 10, lineHeight: 1.9 }}>
                <span style={{ color: C.dim }}>{k}</span>
                <span style={{ color: C.faint }}>{what}</span>
              </div>
            ))}
          </div>
          <input ref={fileInput} type="file" accept=".nodular,application/json" style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) { setOpen(false); actions.onImport(f); }
            }} />
        </div>
      )}
    </div>
  );
}
