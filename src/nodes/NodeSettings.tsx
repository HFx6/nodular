import { useEffect, useRef } from "react";
import { useGraphStore } from "../graph/store";
import type { GraphNode, RenderMode, ValueMode } from "../types";

const VALUE_MODES: Array<{ m: ValueMode; label: string; hint: string }> = [
  { m: "auto", label: "auto", hint: "inferred from the code" },
  { m: "expr", label: "expression", hint: "editor value is returned" },
  { m: "body", label: "function body", hint: "you write the return statement" },
  { m: "text", label: "text", hint: "editor value is treated as text" },
];

// Render modes are how *any* code node displays its value — the generic
// answer to "show this as a table". The dedicated table/text UI node types
// are different beasts: they have interaction semantics (pick a row, edit
// text), not just a view. New display formats belong here (see spawn.ts).
const RENDER_MODES: Array<{ m: RenderMode; label: string; hint: string }> = [
  { m: "default", label: "default", hint: "result strip preview" },
  { m: "table", label: "table", hint: "render array as table" },
  { m: "text", label: "text", hint: "render string as multiline text" },
  { m: "html", label: "HTML", hint: "set string as innerHTML" },
];

/** Per-node settings popover (natto's "eval pane settings"): editor value mode
 *  and render output for code nodes. Canvas surfaces have no settings — their
 *  size comes from the renderer (`{ draw, width, height }`), not a picker.
 *  Opens under the header's ⚙; closes on pick-outside or Escape. */
export function NodeSettings({ node: n, onClose }: { node: GraphNode; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const valueMode = n.valueMode ?? "auto";
  const renderMode = n.renderMode ?? "default";

  return (
    <div ref={root} className="popover nset" onPointerDown={(e) => e.stopPropagation()}>
      <Section title="editor value" />
      {VALUE_MODES.map(({ m, label, hint }) => (
        <Row key={m} label={label} hint={hint} on={valueMode === m}
          onPick={() => useGraphStore.getState().setValueMode(n.id, m === "auto" ? undefined : m)} />
      ))}
      <Section title="render output" />
      {RENDER_MODES.map(({ m, label, hint }) => (
        <Row key={m} label={label} hint={hint} on={renderMode === m}
          onPick={() => useGraphStore.getState().setRenderMode(n.id, m === "default" ? undefined : m)} />
      ))}
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="nset-sect">
      {title}
    </div>
  );
}

function Row({ label, hint, on, onPick }: { label: string; hint: string; on: boolean; onPick: () => void }) {
  return (
    <div className={`nset-row${on ? " on" : ""}`} onClick={onPick}>
      <div className="nset-lbl">{label}</div>
      <div className="nset-hint">{hint}</div>
    </div>
  );
}
