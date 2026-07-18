import { useState } from "react";
import type { RenderMode } from "../types";
import { ValueTable } from "./ValueTable";

interface ValueFaceProps {
  value: unknown;
  mode: RenderMode;
  maxHeight: number;
}

/** Render-output face for a code node's value (natto's "render output"):
 *  - table: an array, or { data, onRowClick? } (natto's exact shape) — row
 *    clicks call the value's own onRowClick (wire a state setter in).
 *  - text: the value as multiline text.
 *  - html: the value as innerHTML.
 *  future: dom / react / graphviz / custom renderers. */
export function ValueFace({ value, mode, maxHeight }: ValueFaceProps) {
  const [selIdx, setSelIdx] = useState(-1);

  if (mode === "table") {
    const rec =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as { data?: unknown; onRowClick?: (row: unknown) => void })
        : undefined;
    const rows = Array.isArray(value)
      ? value
      : Array.isArray(rec?.data)
        ? rec.data
        : null;
    if (!rows || rows.length === 0)
      return <Empty msg="table · waiting for an array or { data }" />;
    const onRowClick =
      typeof rec?.onRowClick === "function" ? rec.onRowClick : undefined;
    return (
      <ValueTable
        rows={rows}
        maxHeight={maxHeight}
        selIdx={selIdx}
        onRowClick={(r, i) => {
          setSelIdx(i);
          onRowClick?.(r);
        }}
      />
    );
  }

  if (value == null) return <Empty msg={`${mode} · waiting for a value`} />;

  if (mode === "html") {
    return (
      <div
        className="face-html"
        style={{ maxHeight }}
        onPointerDown={(e) => e.stopPropagation()}
        dangerouslySetInnerHTML={{ __html: String(value) }}
      />
    );
  }

  // text
  return (
    <div
      className="face-text"
      style={{ maxHeight }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {String(value)}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="face-empty">{msg}</div>;
}
