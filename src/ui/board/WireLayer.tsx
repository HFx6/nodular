import { C, MONO } from "../../theme";
import { wireGeometry } from "../../graph/geometry";
import type { Edge, NodeMap } from "../../types";

interface WireLayerProps {
  nodes: NodeMap;
  edges: Edge[];
  hot: string | null;
  onHot: (id: string | null) => void;
}

/** SVG layer drawing all wires, with hover samples, broken-edge badges, and
 *  cross-language markers. Stream edges animate only while emitting. */
export function WireLayer({ nodes, edges, hot, onHot }: WireLayerProps) {
  return (
    <svg width="1" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      {edges.map((e) => {
        const g = wireGeometry(e, nodes, edges); if (!g) return null;
        return (
          <g key={e.id} style={{ pointerEvents: "auto" }}>
            <path d={g.d} stroke="transparent" strokeWidth="11" fill="none" style={{ cursor: "pointer" }}
              onMouseEnter={() => onHot(e.id)} onMouseLeave={() => onHot(null)} onClick={(ev) => ev.stopPropagation()} />
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
  );
}
