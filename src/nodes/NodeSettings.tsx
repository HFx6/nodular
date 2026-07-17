import { useEffect, useRef } from "react";
import { C, MONO } from "../theme";
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

/** Canvas surface aspect ratios (#11): width/height presets. `undefined`
 *  keeps the historical 3:2 default. NES native is 256×240. */
const ASPECTS: Array<{ a: number | undefined; label: string; hint: string }> = [
  { a: undefined, label: "3:2", hint: "default surface" },
  { a: 1, label: "1:1", hint: "square" },
  { a: 4 / 3, label: "4:3", hint: "classic display" },
  { a: 256 / 240, label: "256:240", hint: "NES native" },
  { a: 16 / 9, label: "16:9", hint: "widescreen" },
];

/** Per-node settings popover (natto's "eval pane settings"): editor value
 *  mode and render output for code nodes; surface aspect for canvas nodes.
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
    <div ref={root} className="popover" onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "absolute", top: 30, right: 6, width: 196, zIndex: 30, fontFamily: MONO,
        background: C.pane, border: `1px solid ${C.edge}`, borderRadius: 4, boxShadow: "0 4px 14px rgba(40,40,36,.12)", padding: "4px 0 6px" }}>
      {n.lang === "canvas" ? (
        <>
          <Section title="aspect ratio" />
          {ASPECTS.map(({ a, label, hint }) => (
            <Row key={label} label={label} hint={hint} on={(n.aspect ?? undefined) === a}
              onPick={() => useGraphStore.getState().setAspect(n.id, a)} />
          ))}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div style={{ padding: "6px 10px 2px", fontSize: 9.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".06em" }}>
      {title}
    </div>
  );
}

function Row({ label, hint, on, onPick }: { label: string; hint: string; on: boolean; onPick: () => void }) {
  return (
    <div onClick={onPick}
      style={{ padding: "4px 10px", cursor: "pointer", background: on ? C.selSoft : "transparent" }}
      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = C.headBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = on ? C.selSoft : "transparent"; }}>
      <div style={{ fontSize: 11, color: C.ink, fontWeight: on ? 600 : 400 }}>{label}</div>
      <div style={{ fontSize: 9.5, color: C.dim }}>{hint}</div>
    </div>
  );
}
