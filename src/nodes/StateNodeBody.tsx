import { useEffect, useMemo, useRef, useState } from "react";
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
        v =
          typeof v === "function"
            ? (v as (prev: unknown) => unknown)(cur.current)
            : v;
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
    <div className="bipane">
      <input
        className="biput"
        value={n.code ?? ""}
        placeholder="initial value (js expression)"
        spellCheck={false}
        onChange={(e) =>
          useGraphStore.getState().updateCode(n.id, e.target.value)
        }
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="birow">
        {err ? (
          <span className="bierr trunc">{err}</span>
        ) : (
          <>
            <span className="bikind">{p.k ?? "value"}</span>
            <span className={`bival trunc${p.v == null ? " unset" : ""}`}>
              {p.v ?? "unset"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
