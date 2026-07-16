import { useEffect, useMemo, useRef, useState } from "react";
import { C, MONO } from "../theme";
import { emitValue } from "../engine/core/engine";
import { PORTS } from "../engine/core/types";
import { preview } from "../engine/core/resultsStore";
import { useGraphStore } from "../graph/store";
import type { GraphNode } from "../types";

/** state built-in (natto's state pane): holds a value. "→" carries the current
 *  value; the `set` output carries a stable setter. set(v) accepts a plain
 *  value or an updater function of the previous value (React-setState style).
 *  Emits a ports record; set() emits on "→" only, so the caller wired to `set`
 *  never re-runs — no echo loop. */
export function StateNodeBody({ node: n }: { node: GraphNode }) {
  const cur = useRef<unknown>(undefined);
  const [, force] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // one setter identity for the node's lifetime — downstream inputs never churn
  const set = useMemo(() => {
    const setter = (v: unknown) => {
      try {
        v = typeof v === "function" ? (v as (prev: unknown) => unknown)(cur.current) : v;
      } catch {
        return; // updater threw — keep the current value (natto behavior)
      }
      if (Object.is(v, cur.current)) return; // unchanged — no re-flow (mobx-atom parity)
      cur.current = v;
      emitValue(n.id, { [PORTS]: true, "→": cur.current, set: setter }, "→");
      force((x) => x + 1);
    };
    return setter;
  }, [n.id]);

  // initial value: n.code evaluated as a JS expression; editing it resets the
  // state. Emits even when empty so the setter reaches `set` wires immediately.
  const code = (n.code ?? "").trim();
  useEffect(() => {
    let v: unknown = undefined;
    if (code) {
      try {
        v = new Function(`return (${code})`)();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        return;
      }
    }
    setErr(null);
    cur.current = v;
    emitValue(n.id, { [PORTS]: true, "→": v, set });
    force((x) => x + 1);
  }, [code, n.id, set]);

  const p = preview(cur.current);
  return (
    <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, display: "grid", gap: 6 }}>
      <input
        value={n.code ?? ""}
        placeholder="initial value (js expression)"
        spellCheck={false}
        onChange={(e) => useGraphStore.getState().updateCode(n.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ fontFamily: MONO, fontSize: 11, padding: "4px 6px", borderRadius: 4,
          border: `1px solid ${C.edge}`, background: C.pane, color: C.ink, outline: "none", width: "100%", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
        {err
          ? <span style={{ fontSize: 10, color: C.bad, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{err}</span>
          : <>
              <span style={{ fontSize: 9.5, color: C.faint }}>{p.k ?? "value"}</span>
              <span style={{ fontSize: 10.5, color: p.v == null ? C.faint : C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.v ?? "unset"}
              </span>
            </>}
      </div>
    </div>
  );
}
