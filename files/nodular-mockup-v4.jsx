import { useState, useRef, useEffect, useMemo, useCallback } from "react";

/* nodular - mockup v4. Conceptual demo: a random-walk particle field.
   tick ─┐
   count ┼→ particles ─draw→ screen
   noise ┤       ↑
   pointer ──────┘ (attractor)
   Engine faked; interactions real: in-pane editing (count → live walker count),
   export inference (delete draw → screen loses its renderer), pan/zoom board,
   pane collapse/delete, click-to-wire, hover samples. */

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
const SANS = "ui-sans-serif, system-ui, sans-serif";
const HEAD = 30;
const ROW = 20;
const GRID = 18;

const C = {
  bg: "#e9e9e6", dot: "#d7d7d3",
  pane: "#ffffff", edge: "#d6d6d2", headBg: "#f6f6f4",
  ink: "#33322e", dim: "#8f8e88", faint: "#b9b8b2",
  wire: "#bdbcb6", wireHot: "#6d6c66",
  sel: "#4c7fae", selSoft: "rgba(76,127,174,.14)",
  bad: "#bb5147", badSoft: "#f7e9e7",
  kw: "#3d6a96", str: "#4e7d64", num: "#8a5a9e", run: "#57a37a",
  dark: "#242331", darkInk: "#c9c8d6",
};

// ---------- inference (fake, but real enough to feel) ----------
function jsExports(code) {
  const out = []; let m;
  const re = /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = re.exec(code))) out.push({ name: m[1] || m[2], fn: !!m[1] });
  return out;
}
function pyDefs(code) {
  const out = []; let m;
  const re = /^def\s+([A-Za-z_]\w*)/gm;
  while ((m = re.exec(code))) out.push({ name: m[1], fn: true });
  return out;
}
function pyResult(code) {
  const lines = code.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.startsWith("import"));
  if (!lines.length) return { v: null, why: "empty" };
  const last = lines[lines.length - 1];
  const def = last.match(/^def\s+([A-Za-z_]\w*)/);
  if (def || /^\s/.test(code.split("\n").filter(Boolean).slice(-1)[0] || "")) return { v: null, why: `module of defs` };
  if (/^[A-Za-z_]\w*\s*=/.test(last)) return { v: null, why: `last line assigns ${last.split("=")[0].trim()}` };
  if (/^-?\d+(\.\d+)?$/.test(last)) return { v: last, k: "num" };
  const env = {};
  for (const l of lines) { const a = l.match(/^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)$/); if (a) env[a[1]] = a[2]; }
  if (env[last] != null) return { v: env[last], k: "num" };
  return { v: "…", k: "expr" };
}

// ---------- initial graph (grid-aligned) ----------
const P0 = {
  tick: { id: "tick", lang: "ui", name: "tick", x: 54, y: 54, w: 168, kind: "tick" },
  count: { id: "count", lang: "py", name: "count", x: 54, y: 180, w: 168, edit: true, code: `n = 40\nn` },
  noise: { id: "noise", lang: "py", name: "noise", x: 54, y: 342, w: 222,
    code: `import math\n\ndef field(x, y):\n    a = math.sin(x*3)\n    return a * math.cos(y*3)` },
  parts: { id: "parts", lang: "js", name: "particles", x: 342, y: 180, w: 240, edit: true, running: true,
    code: `export function draw(ctx) {\n  each(count, w =>\n    w.step(field, cursor))\n  paint(ctx)\n}` },
  ptr: { id: "ptr", lang: "ui", name: "pointer", x: 342, y: 450, w: 186, kind: "pointer", target: "screen" },
  cvs: { id: "cvs", lang: "canvas", name: "screen", x: 666, y: 180, w: 288, ins: ["render"] },
};
const E0 = [
  { id: "e1", from: ["tick", "→"], to: ["parts", "tick"], sample: "t=48213 · 60/s", stream: true },
  { id: "e2", from: ["count", "→"], to: ["parts", "count"], sample: "40 · num" },
  { id: "e3", from: ["noise", "field"], to: ["parts", "field"], xlang: "py→js", sample: "ƒ field(x, y) → num" },
  { id: "e4", from: ["ptr", "→"], to: ["parts", "cursor"], sample: "{x: 214, y: 96}", stream: true },
  { id: "e5", from: ["parts", "draw"], to: ["cvs", "render"], sample: "ƒ draw(ctx)" },
];

// ---------- geometry ----------
function outsOf(p) {
  if (p.lang === "canvas" || p.lang === "ui") return [];
  if (p.lang === "js") return jsExports(p.code);
  return pyDefs(p.code);
}
function inputsOf(p, edges) {
  if (p.lang === "canvas") return p.ins;
  const seen = [];
  edges.forEach((e) => { if (e.to[0] === p.id && !seen.includes(e.to[1])) seen.push(e.to[1]); });
  return seen;
}
function portPos(p, port, side, edges) {
  if (p.min) return { x: side === "in" ? p.x : p.x + p.w, y: p.y + HEAD / 2 };
  if (side === "out") {
    if (port === "→") return { x: p.x + p.w, y: p.y + HEAD / 2 };
    const outs = outsOf(p);
    const i = outs.findIndex((o) => o.name === port);
    if (i < 0) return { x: p.x + p.w, y: p.y + HEAD + 12, missing: true };
    return { x: p.x + p.w, y: p.y + HEAD + 16 + i * ROW };
  }
  const ins = inputsOf(p, edges);
  const i = ins.indexOf(port);
  return { x: p.x, y: p.y + HEAD + 14 + Math.max(i, 0) * ROW };
}

// ---------- light syntax tint ----------
function Tint({ code }) {
  return code.split("\n").map((l, i) => {
    const parts = l.split(/(f?".*?"|\b(?:export|function|import|const|def|return|new)\b|\b\d+(?:\.\d+)?\b)/g).filter(Boolean);
    return (
      <div key={i} style={{ whiteSpace: "pre" }}>
        {parts.map((t, j) =>
          /^f?".*"$/.test(t) ? <span key={j} style={{ color: C.str }}>{t}</span>
          : /^(export|function|import|const|def|return|new)$/.test(t) ? <span key={j} style={{ color: C.kw }}>{t}</span>
          : /^\d+(\.\d+)?$/.test(t) ? <span key={j} style={{ color: C.num }}>{t}</span>
          : <span key={j}>{t}</span>)}
        {l === "" && "\u00a0"}
      </div>
    );
  });
}

// ---------- the screen: walkers chasing the cursor, count is live ----------
function Surface({ live }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext("2d");
    let raf;
    const walkers = [];
    const onMove = (e) => {
      const r = cv.getBoundingClientRect();
      live.current.cursor = { x: ((e.clientX - r.left) / r.width) * cv.width, y: ((e.clientY - r.top) / r.height) * cv.height };
    };
    const onLeave = () => (live.current.cursor = null);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    const loop = () => {
      const { count, rendered, cursor } = live.current;
      live.current.t++;
      while (walkers.length < count) walkers.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, h: [] });
      walkers.length = Math.max(0, count);
      ctx.fillStyle = C.dark; ctx.fillRect(0, 0, cv.width, cv.height);
      if (!rendered) {
        ctx.fillStyle = "#5b5877"; ctx.font = "11px monospace";
        ctx.fillText("no renderer connected", cv.width / 2 - 62, cv.height / 2);
      } else {
        ctx.strokeStyle = "rgba(217,215,235,.55)"; ctx.lineWidth = 1;
        for (const w of walkers) {
          let dx = (Math.random() - 0.5) * 4, dy = (Math.random() - 0.5) * 4;
          if (cursor) { dx += (cursor.x - w.x) * 0.012; dy += (cursor.y - w.y) * 0.012; }
          w.x = Math.max(0, Math.min(cv.width, w.x + dx));
          w.y = Math.max(0, Math.min(cv.height, w.y + dy));
          w.h.push([w.x, w.y]); if (w.h.length > 14) w.h.shift();
          ctx.beginPath();
          w.h.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
        ctx.fillStyle = C.darkInk; ctx.font = "10px monospace";
        ctx.fillText(`${walkers.length} walkers`, 10, 16);
        if (cursor) { ctx.fillStyle = "#d9a13f"; ctx.fillRect(cursor.x - 2, cursor.y - 2, 4, 4); }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); };
  }, []);
  return <canvas ref={ref} width={286} height={190} style={{ display: "block", width: "100%", height: "auto", aspectRatio: "286 / 190", cursor: "crosshair" }} />;
}

// ---------- app ----------
export default function NodularV4() {
  const [panes, setPanes] = useState(P0);
  const [edges, setEdges] = useState(E0);
  const [sel, setSel] = useState("count");
  const [rail, setRail] = useState(false);
  const [arm, setArm] = useState(null);
  const [hot, setHot] = useState(null);
  const [note, setNote] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [tickN, setTickN] = useState(0);
  const drag = useRef(null);
  const board = useRef(null);
  const live = useRef({ count: 40, rendered: true, cursor: null, t: 0 });

  const say = (m) => { setNote(m); clearTimeout(say._t); say._t = setTimeout(() => setNote(null), 2400); };

  // derived: count value feeds the surface; renderer presence feeds it too
  const countRes = useMemo(() => pyResult(panes.count?.code ?? ""), [panes.count?.code]);
  useEffect(() => { live.current.count = Math.max(0, Math.min(600, parseInt(countRes.v ?? "0", 10) || 0)); }, [countRes]);
  useEffect(() => {
    const ok = !!panes.parts && !!panes.cvs && edges.some((e) => e.to[0] === "cvs" && e.to[1] === "render" &&
      panes[e.from[0]] && (e.from[1] === "→" || outsOf(panes[e.from[0]]).some((o) => o.name === e.from[1])));
    live.current.rendered = ok;
  }, [panes, edges]);
  useEffect(() => { const i = setInterval(() => setTickN(live.current.t), 500); return () => clearInterval(i); }, []);

  // board navigation: drag background pans, wheel pans, ctrl/pinch zooms
  useEffect(() => {
    const el = board.current;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        setView((v) => {
          const k = Math.min(1.6, Math.max(0.45, v.k * (1 - e.deltaY * 0.01)));
          const r = el.getBoundingClientRect();
          const mx = e.clientX - r.left, my = e.clientY - r.top;
          return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
        });
      } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const toBoard = (e) => {
    const r = board.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  };
  const paneDown = (e, id) => { const p = toBoard(e); drag.current = { id, dx: p.x - panes[id].x, dy: p.y - panes[id].y }; setSel(id); };
  const bgDown = (e) => { drag.current = { pan: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    if (d.pan) { setView((v) => ({ ...v, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy })); return; }
    const p = toBoard(e);
    const x = Math.max(6, Math.round((p.x - d.dx) / GRID) * GRID);
    const y = Math.max(6, Math.round((p.y - d.dy) / GRID) * GRID);
    setPanes((ps) => (ps[d.id].x === x && ps[d.id].y === y ? ps : { ...ps, [d.id]: { ...ps[d.id], x, y } }));
  };

  // header controls - all functional
  const del = (e, id) => { e.stopPropagation(); setPanes((p) => { const n = { ...p }; delete n[id]; return n; }); setEdges((es) => es.filter((x) => x.from[0] !== id && x.to[0] !== id)); if (sel === id) setSel(Object.keys(panes).find((k) => k !== id)); };
  const mini = (e, id) => { e.stopPropagation(); setPanes((p) => ({ ...p, [id]: { ...p[id], min: !p[id].min } })); };
  const mode = (e, id) => { e.stopPropagation(); setPanes((p) => ({ ...p, [id]: { ...p[id], manual: !p[id].manual } })); };
  const runOnce = (e, id) => { e.stopPropagation(); say(`ran ${panes[id].name}`); };
  const addPane = () => {
    const id = "p" + Math.random().toString(36).slice(2, 6);
    setPanes((p) => ({ ...p, [id]: { id, lang: "js", name: id, x: 54 + GRID * 2, y: 54 + GRID * 2, w: 204, edit: true, code: `1 + 1` } }));
    setSel(id); say("new pane - start typing");
  };

  const armOut = (e, id, port) => { e.stopPropagation(); setArm({ id, port }); say(`connecting ${port === "→" ? id : port} - click a pane's left edge`); };
  const dropIn = (e, id, port) => {
    e.stopPropagation(); if (!arm) return;
    if (arm.id === id) { setArm(null); say("not into itself"); return; }
    const name = port || (arm.port === "→" ? arm.id : arm.port);
    setEdges((es) => [...es.filter((x) => !(x.to[0] === id && x.to[1] === name)),
      { id: "e" + Math.random().toString(36).slice(2, 6), from: [arm.id, arm.port], to: [id, name], sample: "…first value pending" }]);
    setArm(null); say(`${name} is now in scope`);
  };

  const geo = useCallback((e) => {
    const s = panes[e.from[0]], d = panes[e.to[0]];
    if (!s || !d) return null;
    const a = portPos(s, e.from[1], "out", edges);
    const b = portPos(d, e.to[1], "in", edges);
    let broken = a.missing;
    if (e.from[1] !== "→" && (s.lang === "js" || s.lang === "py") && !outsOf(s).some((o) => o.name === e.from[1])) broken = true;
    const dx = Math.max(38, Math.abs(b.x - a.x) * 0.42);
    return { a, b, broken, d: `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}` };
  }, [panes, edges]);

  const results = {
    count: countRes,
    parts: { v: null, why: "module - exports carry the value" },
    noise: { v: null, why: "module of defs" },
  };
  const selPane = panes[sel] ?? Object.values(panes)[0];

  return (
    <div style={{ fontFamily: SANS, width: "100%", height: "100dvh", minHeight: 480, display: "flex", flexDirection: "column", background: C.bg, color: C.ink, userSelect: "none", overflow: "hidden" }}>
      <style>{`
        @keyframes drift { to { stroke-dashoffset: -16; } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        textarea:focus{outline:none}
        .ctrl{color:${C.faint}; font-size:11px; cursor:pointer; line-height:1} .ctrl:hover{color:${C.ink}}
        .olabel{display:flex; justify-content:flex-end; align-items:center; gap:5px; height:${ROW}px;
          font-family:${MONO}; font-size:11px; color:${C.dim}; cursor:pointer; padding-right:10px}
        .olabel:hover{color:${C.ink}}
        .ilabel{position:absolute; right:100%; padding-right:7px; height:${ROW}px; display:flex; align-items:center;
          font-family:${MONO}; font-size:11px; color:${C.dim}; white-space:nowrap; cursor:pointer}
        .ilabel:hover{color:${C.ink}}
      `}</style>

      {/* top bar - only things that do things */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 14px", borderBottom: `1px solid ${C.edge}`, background: C.pane }}>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>nodular</span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.dim }}>walkers.nodular</span>
        <button onClick={addPane}
          style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11.5, padding: "3px 10px", borderRadius: 4, border: `1px solid ${C.edge}`, background: C.pane, color: C.ink, cursor: "pointer" }}>+ pane</button>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{Math.round(view.k * 100)}%</span>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* board */}
        <div ref={board} onPointerMove={move} onPointerUp={() => (drag.current = null)}
          onPointerDown={(e) => { if (e.target === board.current || e.target === board.current.firstChild) bgDown(e); }}
          onClick={(e) => { if (e.target === board.current || e.target === board.current.firstChild) setArm(null); }}
          style={{ position: "relative", flex: 1, overflow: "hidden", cursor: arm ? "crosshair" : "default",
            backgroundImage: `radial-gradient(${C.dot} 1px, transparent 1px)`,
            backgroundSize: `${GRID * view.k}px ${GRID * view.k}px`,
            backgroundPosition: `${view.x}px ${view.y}px` }}>

          <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: "0 0" }}>
            <svg width="1" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
              {edges.map((e) => {
                const g = geo(e); if (!g) return null;
                return (
                  <g key={e.id} style={{ pointerEvents: "auto" }}>
                    <path d={g.d} stroke="transparent" strokeWidth="11" fill="none" style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHot(e.id)} onMouseLeave={() => setHot(null)} onClick={(ev) => ev.stopPropagation()} />
                    <path d={g.d} fill="none"
                      stroke={g.broken ? C.bad : hot === e.id ? C.wireHot : C.wire}
                      strokeWidth={hot === e.id ? 1.6 : 1.2}
                      strokeDasharray={g.broken ? "3 4" : e.stream ? "1 7" : "none"}
                      strokeLinecap="round"
                      style={e.stream && !g.broken ? { animation: "drift 1.1s linear infinite" } : {}} />
                    {(hot === e.id || g.broken) && (
                      <foreignObject x={(g.a.x + g.b.x) / 2 - 80} y={(g.a.y + g.b.y) / 2 - 24} width="160" height="40" style={{ overflow: "visible", pointerEvents: "none" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap",
                            background: g.broken ? C.badSoft : C.ink, color: g.broken ? C.bad : "#f2f1ec",
                            border: g.broken ? `1px solid ${C.bad}` : "none" }}>
                            {g.broken ? `missing export "${e.from[1]}"` : e.sample}
                          </span>
                        </div>
                      </foreignObject>
                    )}
                    {e.xlang && hot !== e.id && !g.broken && (
                      <foreignObject x={(g.a.x + g.b.x) / 2 - 24} y={(g.a.y + g.b.y) / 2 - 9} width="48" height="18" style={{ overflow: "visible", pointerEvents: "none" }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, padding: "1px 5px", borderRadius: 8, background: C.pane, border: `1px solid ${C.edge}`, color: C.dim }}>{e.xlang}</span>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>

            {Object.values(panes).map((p) => {
              const outs = outsOf(p);
              const ins = inputsOf(p, edges);
              const res = results[p.id];
              const seld = sel === p.id;
              return (
                <div key={p.id} onPointerDown={(e) => { e.stopPropagation(); }}
                  style={{ position: "absolute", left: p.x, top: p.y, width: p.w, background: C.pane, borderRadius: 4,
                    border: `1px solid ${seld ? C.sel : C.edge}`, boxShadow: seld ? `0 0 0 3px ${C.selSoft}` : "0 1px 3px rgba(40,40,36,.07)" }}>

                  {/* header: × – name lang · mode · run · → */}
                  <div onPointerDown={(e) => { e.stopPropagation(); paneDown(e, p.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 7, height: HEAD, padding: "0 8px 0 10px", background: C.headBg,
                      borderBottom: p.min ? "none" : `1px solid ${C.edge}`, borderRadius: p.min ? 4 : "4px 4px 0 0", cursor: "grab" }}>
                    <span className="ctrl" onClick={(e) => del(e, p.id)}>×</span>
                    <span className="ctrl" onClick={(e) => mini(e, p.id)}>–</span>
                    <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                    {p.lang !== "canvas" && p.lang !== "ui" && <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{p.lang}</span>}
                    {p.running && <span title="running" style={{ width: 6, height: 6, borderRadius: 3, background: C.run, animation: "blink 1.8s ease-in-out infinite" }} />}
                    <span style={{ marginLeft: "auto" }} />
                    {p.lang !== "canvas" && p.lang !== "ui" && (
                      <span className="ctrl" style={{ fontSize: 10 }} onClick={(e) => mode(e, p.id)}>{p.manual ? "manual" : "auto"} ▾</span>
                    )}
                    {p.manual && <span className="ctrl" style={{ fontSize: 11 }} onClick={(e) => runOnce(e, p.id)}>▷</span>}
                    {p.lang !== "canvas" && (
                      <span className="ctrl" title="this pane's value" onClick={(e) => armOut(e, p.id, "→")}
                        style={{ fontSize: 13, color: res?.v != null || p.lang === "ui" ? C.ink : C.faint }}>→</span>
                    )}
                  </div>

                  {/* inputs on the left edge */}
                  {!p.min && ins.map((name, i) => (
                    <span key={name} className="ilabel" style={{ top: HEAD + 4 + i * ROW, color: arm ? C.sel : undefined }}
                      onClick={(e) => dropIn(e, p.id, name)}>{name}</span>
                  ))}
                  {!p.min && arm && arm.id !== p.id && p.lang !== "canvas" && p.lang !== "ui" && (
                    <span className="ilabel" style={{ top: HEAD + 4 + ins.length * ROW, color: C.sel, fontStyle: "italic" }}
                      onClick={(e) => dropIn(e, p.id, null)}>+ {arm.port === "→" ? arm.id : arm.port}</span>
                  )}

                  {/* body */}
                  {!p.min && (p.lang === "canvas" ? (
                    <div style={{ borderRadius: "0 0 4px 4px", overflow: "hidden" }} onPointerDown={(e) => e.stopPropagation()}>
                      <Surface live={live} />
                    </div>
                  ) : p.lang === "ui" ? (
                    <div style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, display: "grid", gap: 5 }}>
                      {p.kind === "tick" ? (<>
                        <div style={{ color: C.dim }}>interval <span style={{ color: C.ink }}>16ms ▾</span></div>
                        <div style={{ color: C.faint, fontSize: 10 }}>t · <span style={{ color: C.dim }}>{tickN}</span></div>
                      </>) : (<>
                        <div style={{ color: C.dim }}>surface <span style={{ color: C.ink }}>{p.target} ▾</span></div>
                        <div style={{ color: C.faint, fontSize: 10 }}>last · <span style={{ color: C.dim }}>{live.current.cursor ? `${Math.round(live.current.cursor.x)}, ${Math.round(live.current.cursor.y)}` : "outside"}</span></div>
                      </>)}
                    </div>
                  ) : (
                    <>
                      <div onPointerDown={p.edit ? (e) => { e.stopPropagation(); setSel(p.id); } : (e) => e.stopPropagation()}
                        style={{ position: "relative", padding: "8px 10px", fontFamily: MONO, fontSize: 11.5, lineHeight: "17px", color: C.ink,
                          paddingRight: outs.length ? 82 : 10, cursor: p.edit ? "text" : "default" }}>
                        <Tint code={p.code} />
                        {p.edit && (
                          <textarea value={p.code} spellCheck={false} wrap="off"
                            onChange={(e) => setPanes((ps) => ({ ...ps, [p.id]: { ...ps[p.id], code: e.target.value } }))}
                            style={{ position: "absolute", inset: 0, padding: "8px 10px", paddingRight: outs.length ? 82 : 10,
                              fontFamily: MONO, fontSize: 11.5, lineHeight: "17px", whiteSpace: "pre", overflow: "hidden",
                              color: "transparent", caretColor: C.ink, background: "transparent", border: "none", resize: "none", zIndex: 1 }} />
                        )}
                        <div style={{ position: "absolute", top: 8, right: 0, zIndex: 2 }}>
                          {outs.map((o) => (
                            <div key={o.name} className="olabel" onClick={(e) => armOut(e, p.id, o.name)}>
                              {o.fn ? "ƒ " : ""}{o.name} <span style={{ color: C.faint }}>→</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.edge}`, padding: "5px 10px", fontFamily: MONO, fontSize: 11, minHeight: 26,
                        color: res?.v != null ? C.ink : C.faint, display: "flex", gap: 8, alignItems: "baseline", background: "#fcfcfa", borderRadius: "0 0 4px 4px" }}>
                        {res?.v != null ? (<>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.v}</span>
                          <span style={{ fontSize: 9, color: C.faint }}>{res.k}</span>
                        </>) : (
                          <span style={{ fontStyle: "italic", fontSize: 10.5 }}>no value - {res?.why ?? "…"}</span>
                        )}
                      </div>
                    </>
                  ))}
                </div>
              );
            })}
          </div>

          <div style={{ position: "absolute", left: 14, bottom: 10, fontSize: 10.5, color: C.faint, pointerEvents: "none", fontFamily: MONO }}>
            edit count, hover the screen · drag background to pan, pinch/ctrl-wheel to zoom · × – auto▾ all live
          </div>
          {note && (
            <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontFamily: MONO, fontSize: 11, background: C.ink, color: "#f2f1ec", padding: "5px 12px", borderRadius: 4, zIndex: 5 }}>{note}</div>
          )}
        </div>

        {/* collapsible editor rail */}
        {!rail ? (
          <div onClick={() => setRail(true)}
            style={{ width: 24, borderLeft: `1px solid ${C.edge}`, background: C.pane, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 8 }}>
            <span style={{ fontSize: 11, color: C.dim }}>«</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, writingMode: "vertical-rl" }}>editor</span>
          </div>
        ) : (
          <div style={{ width: "min(296px, 38vw)", borderLeft: `1px solid ${C.edge}`, background: C.pane, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.edge}` }}>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{selPane?.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{selPane?.lang}</span>
              <span className="ctrl" style={{ marginLeft: "auto", fontSize: 12 }} onClick={() => setRail(false)}>»</span>
            </div>
            {selPane && selPane.lang !== "canvas" && selPane.lang !== "ui" ? (
              <>
                <textarea value={selPane.code} spellCheck={false} readOnly={!selPane.edit}
                  onChange={(e) => setPanes((p) => ({ ...p, [selPane.id]: { ...p[selPane.id], code: e.target.value } }))}
                  style={{ flex: 1, resize: "none", border: "none", background: "transparent", padding: "10px 12px",
                    fontFamily: MONO, fontSize: 12, lineHeight: 1.7, color: selPane.edit ? C.ink : C.dim }} />
                <div style={{ borderTop: `1px dashed ${C.edge}`, padding: "7px 12px", fontSize: 10.5, color: C.dim, lineHeight: 1.6 }}>
                  {selPane.id === "count" && <>the last expression is this pane's value - set n to 200 and watch the screen.</>}
                  {selPane.id === "parts" && <>delete the draw export and the screen loses its renderer; retype it and it's back.</>}
                  {selPane.id === "noise" && <>a module of defs - ƒ field crosses py→js as an async function.</>}
                  {!["count", "parts", "noise"].includes(selPane.id) && <>the last expression is this pane's value.</>}
                </div>
              </>
            ) : (
              <div style={{ padding: 12, fontSize: 12, color: C.dim, lineHeight: 1.65 }}>
                {selPane?.lang === "canvas"
                  ? <>The screen is a pure sink - one input, and its body is the surface. Hover it: the pointer source pane reads from it and the walkers follow.</>
                  : selPane?.kind === "tick"
                    ? <>A clock source - emits at the chosen interval. Its → is a stream.</>
                    : <>A source pane emitting pointer events from the surface it's pointed at. Sinks sink, sources source.</>}
              </div>
            )}
            <div style={{ borderTop: `1px solid ${C.edge}`, padding: "9px 12px" }}>
              <div style={{ fontSize: 10, color: C.faint, marginBottom: 5 }}>in scope</div>
              {edges.filter((e) => e.to[0] === sel).map((e) => (
                <div key={e.id} style={{ display: "flex", gap: 7, alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11 }}>{e.to[1]}</span>
                  <span style={{ fontSize: 10, color: C.faint }}>← {panes[e.from[0]]?.name}</span>
                </div>
              ))}
              {edges.filter((e) => e.to[0] === sel).length === 0 && <div style={{ fontSize: 10.5, color: C.faint, fontStyle: "italic" }}>nothing wired in</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}