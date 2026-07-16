import { useEffect, useRef, useState } from "react";
import { C, MONO } from "../theme";
import { emitValue } from "../engine/core/engine";
import { useGraphStore } from "../graph/store";
import type { GraphNode } from "../types";

type Status = { k: "idle" | "loading" | "ok" | "err"; msg: string };

/** import built-in: a package name or URL in n.code. Bare names load via esm.sh,
 *  URLs load directly; the module (or module.default when useDefault) is emitted
 *  on "→". Debounced so a typing burst is one load; stale loads are discarded. */
export function ImportNodeBody({ node: n }: { node: GraphNode }) {
  const spec = (n.code ?? "").trim();
  const useDefault = n.useDefault ?? true;
  const [status, setStatus] = useState<Status>({ k: "idle", msg: "package or url" });
  const latest = useRef(0);

  useEffect(() => {
    if (!spec) { setStatus({ k: "idle", msg: "package or url" }); return; }
    const token = ++latest.current;
    const t = setTimeout(() => {
      const url = /^(https?:|\.|\/)/.test(spec) ? spec : `https://esm.sh/${spec}`;
      setStatus({ k: "loading", msg: "loading…" });
      import(/* @vite-ignore */ url).then(
        (mod) => {
          if (token !== latest.current) return; // superseded
          // Spread the namespace into a plain object: the engine's portValue
          // unwraps `default` off Module-tagged values on "→" (right for
          // js-module nodes), but in namespace mode this node's value IS the
          // namespace — untag it so it crosses the wire whole.
          emitValue(n.id, useDefault ? (mod as { default?: unknown }).default : { ...mod });
          setStatus({ k: "ok", msg: useDefault ? "loaded · default" : "loaded · namespace" });
        },
        (err) => {
          if (token !== latest.current) return;
          setStatus({ k: "err", msg: err instanceof Error ? err.message : String(err) });
        },
      );
    }, 350);
    return () => clearTimeout(t);
  }, [spec, useDefault, n.id]);

  const color = status.k === "err" ? C.bad : status.k === "ok" ? C.ink : C.faint;

  return (
    <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, display: "grid", gap: 6 }}>
      <input
        value={n.code ?? ""}
        placeholder="lodash-es, uuid@9, https://…"
        spellCheck={false}
        onChange={(e) => useGraphStore.getState().updateCode(n.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ fontFamily: MONO, fontSize: 11, padding: "4px 6px", borderRadius: 4,
          border: `1px solid ${C.edge}`, background: C.pane, color: C.ink, outline: "none", width: "100%", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          className="ctrl"
          onClick={(e) => { e.stopPropagation(); useGraphStore.getState().toggleUseDefault(n.id); }}
          style={{ fontSize: 10.5, color: C.dim, cursor: "pointer" }}>
          {useDefault ? "default ▾" : "namespace ▾"}
        </span>
        <span style={{ fontSize: 10, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130, textAlign: "right" }}>
          {status.msg}
        </span>
      </div>
    </div>
  );
}
