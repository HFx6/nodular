import {
  memo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  IconAdjustmentsHorizontal,
  IconAlignLeft,
  IconArrowDownRight,
  IconBrush,
  IconChevronDown,
  IconCode,
  IconDatabase,
  IconDownload,
  IconFile,
  IconMinus,
  IconPhoto,
  IconPlayerPlay,
  IconTable,
  IconX,
} from "@tabler/icons-react";
import { C, HEAD, ROW } from "../theme";
import { inputsOf, outsOf } from "../graph/geometry";
import { useNodeResult } from "../engine/core/resultsStore";
import type { ArmState, Edge, GraphNode } from "../types";
import type { NodeActions } from "../graph/useGraph";
import { CodeNodeBody } from "./CodeNodeBody";
import { CanvasNodeBody } from "./CanvasNodeBody";
import { SourceNodeBody } from "./SourceNodeBody";
import { TableNodeBody } from "./TableNodeBody";
import { ImageNodeBody } from "./ImageNodeBody";
import { ImportNodeBody } from "./ImportNodeBody";
import { TextNodeBody } from "./TextNodeBody";
import { StateNodeBody } from "./StateNodeBody";
import { NodeSettings } from "./NodeSettings";

// header icons are tabler at 13px with thin strokes, in currentColor so the
// .ctrl class's dim→ink hover swap applies
const icon = { size: 13, stroke: 1.5 } as const;

// black kind tab (Observable): family icon + kind label, front of the header
const kindIcon = { size: 12, stroke: 1.5 } as const;
const KIND_ICONS: Record<string, typeof IconCode> = {
  canvas: IconBrush,
  table: IconTable,
  image: IconPhoto,
  import: IconDownload,
  text: IconAlignLeft,
  state: IconDatabase,
  source: IconFile,
};

/** kind label shown in the tab: the lang for code nodes, the ui kind otherwise */
function kindOf(n: GraphNode): string {
  if (n.lang === "canvas") return "canvas";
  if (n.lang === "ui") return n.kind ?? "source";
  return n.lang;
}

interface NodeCardProps {
  node: GraphNode;
  edges: Edge[];
  selected: boolean;
  arm: ArmState | null;
  actions: NodeActions;
  /** an edge holds the hover focus and this node isn't an endpoint (#3) */
  dimmed: boolean;
  onHeaderPointerDown: (e: ReactPointerEvent, id: string) => void;
  /** double-click on a code node's header opens the editor rail (#7) */
  onHeaderDoubleClick: (id: string) => void;
  onResizeStart: (e: ReactPointerEvent, id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

/** The common node shell: header (controls + value port), input handles on the
 *  left edge, and a family-specific body. Memoized — engine ticks and board
 *  pan/zoom must not re-render node chrome (ENGINE.md); the engine's result
 *  arrives through a per-id store subscription, not props. */
function NodeCardImpl({
  node: n,
  edges,
  selected: seld,
  arm,
  actions,
  dimmed,
  onHeaderPointerDown,
  onHeaderDoubleClick,
  onResizeStart,
  registerRef,
}: NodeCardProps) {
  const res = useNodeResult(n.id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // reliable double-click to open the rail: pointer capture during a node drag
  // retargets mouse events to the board, so the native dblclick often never
  // composes — detect a second press within 400ms ourselves, on the whole
  // header (background + title; controls excluded) (#7)
  const lastHeadDown = useRef(0);
  const isCode = n.lang !== "canvas" && n.lang !== "ui";
  const hasSettings = isCode;
  const ins = inputsOf(n, edges);
  const outs = outsOf(n);
  return (
    <div
      ref={(el) => registerRef(n.id, el)}
      className={`ncard dimmable${seld ? " sel" : ""}`}
      onPointerDown={(e) => {
        if (e.button === 0) e.stopPropagation();
      }}
      style={{
        left: n.x,
        top: n.y,
        width: n.w,
        ...(n.h && !n.min ? { height: n.h } : {}),
        opacity: dimmed ? 0.25 : 1,
      }}
    >
      <div
        className={`node-head${n.min ? " min" : ""}`}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          // second press on the header (not on a control) opens the editor; the
          // press that opens it must not also start a node drag
          const t = e.target instanceof HTMLElement ? e.target : null;
          if (isCode && (!t || !t.closest(".ctrl, .hctl"))) {
            if (e.timeStamp - lastHeadDown.current < 400) {
              lastHeadDown.current = 0;
              onHeaderDoubleClick(n.id);
              return;
            }
            lastHeadDown.current = e.timeStamp;
          }
          onHeaderPointerDown(e, n.id);
        }}
      >
        {/* black kind tab first (Observable), then the mono name chip */}
        {(() => {
          const kind = kindOf(n);
          const KIcon = KIND_ICONS[kind] ?? IconCode;
          return (
            <span className="node-kindtab">
              <KIcon {...kindIcon} />
              {kind}
            </span>
          );
        })()}
        {/* the title never shrinks or ellipsizes — minNodeWidth clamps resizes
            so the header always has room for every item at full length */}
        <span
          className="node-title"
          title={isCode ? "double-click to open the editor" : undefined}
        >
          {n.name ? (
            <span className="node-name">{n.name}</span>
          ) : (
            <span className="node-name empty">name</span>
          )}
        </span>
        {/* control cluster pushed right: × · – · ⚙ · auto-pill · ▷-pill, then
            the port (must stay last, on the edge, for wire anchoring) */}
        <span
          className="ctrl push"
          title="delete node"
          onClick={(e) => {
            e.stopPropagation();
            actions.onDelete(n.id);
          }}
        >
          <IconX {...icon} />
        </span>
        <span
          className="ctrl"
          title="minimize"
          onClick={(e) => {
            e.stopPropagation();
            actions.onToggleMin(n.id);
          }}
        >
          <IconMinus {...icon} />
        </span>
        {hasSettings && (
          <span
            className="ctrl"
            title="node settings"
            onClick={(e) => {
              e.stopPropagation();
              setSettingsOpen((o) => !o);
            }}
          >
            <IconAdjustmentsHorizontal {...icon} />
          </span>
        )}
        {isCode && (
          <span
            className="hctl pillbtn node-mode"
            title={
              n.manual
                ? "manual — click to run automatically"
                : "auto — click for manual"
            }
            onClick={(e) => {
              e.stopPropagation();
              actions.onToggleMode(n.id);
            }}
          >
            {n.manual ? "manual" : "auto"}{" "}
            <IconChevronDown size={9} stroke={1.75} />
          </span>
        )}
        {isCode && (
          <span
            className="hctl pillbtn node-run"
            title="run now"
            onClick={(e) => {
              e.stopPropagation();
              actions.onRunOnce(n.id);
            }}
          >
            <IconPlayerPlay size={11} stroke={1.5} />
          </span>
        )}
        {n.lang !== "canvas" && (
          <span
            className={`ctrl node-port${res?.v != null || n.lang === "ui" ? " port-live" : ""}`}
            title="this node's value"
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              actions.onArmOut(n.id, "→");
            }}
            onClick={(e) => e.stopPropagation()}
          >
            →
          </span>
        )}
      </div>

      {settingsOpen && (
        <NodeSettings node={n} onClose={() => setSettingsOpen(false)} />
      )}

      {/* inputs on the left edge: chipped label for contrast over wires (#4) */}
      {!n.min &&
        ins.map((name, i) => (
          <span
            key={name}
            className={arm ? "ilabel armed" : "ilabel"}
            style={{ top: HEAD + 4 + i * ROW }}
            onPointerUp={() => actions.onDropIn(n.id, name)}
            onClick={(e) => {
              e.stopPropagation();
              actions.onDropIn(n.id, name);
            }}
          >
            <span className="portchip">{name}</span>
          </span>
        ))}
      {!n.min && arm && arm.id !== n.id && isCode && (
        <span
          className="ilabel add"
          style={{ top: HEAD + 4 + ins.length * ROW }}
          onPointerUp={() => actions.onDropIn(n.id, null)}
          onClick={(e) => {
            e.stopPropagation();
            actions.onDropIn(n.id, null);
          }}
        >
          + {arm.port === "→" ? arm.id : arm.port}
        </span>
      )}

      {/* inferred export handles, outside the right edge (aligned to wire anchors) */}
      {!n.min &&
        outs.map((o, i) => (
          <span
            key={o.name}
            className="olabel"
            style={{ top: HEAD + 6 + i * ROW }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              actions.onArmOut(n.id, o.name);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="portchip">
              {o.fn ? "ƒ " : ""}
              {o.name}
            </span>{" "}
            <span className="faint">→</span>
          </span>
        ))}

      {/* family body */}
      {!n.min &&
        (n.lang === "canvas" ? (
          <CanvasNodeBody node={n} />
        ) : n.lang === "ui" ? (
          n.kind === "table" ? (
            <TableNodeBody node={n} />
          ) : n.kind === "image" ? (
            <ImageNodeBody node={n} />
          ) : n.kind === "import" ? (
            <ImportNodeBody node={n} />
          ) : n.kind === "text" ? (
            <TextNodeBody node={n} />
          ) : n.kind === "state" ? (
            <StateNodeBody node={n} />
          ) : (
            <SourceNodeBody node={n} />
          )
        ) : (
          <CodeNodeBody node={n} result={res} actions={actions} />
        ))}

      {/* resize grip */}
      <div
        className={seld ? "node-grip shown" : "node-grip"}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          onResizeStart(e, n.id);
        }}
      >
        <IconArrowDownRight size={12} stroke={1.5} color={C.faint} />
      </div>
    </div>
  );
}

export const NodeCard = memo(NodeCardImpl);
