import { useMemo } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Target from "../Base/Handles/Target";

import "./style.css";

export default function Canvas({ data }) {
	return (
		<div className="basenode-container Canvas">
			<div className={`basenode-header Canvas`}>
				<div className="basenode-label Canvas">{data.label}</div>
				<div className="basenode-icon Canvas">@</div>
			</div>
			<div className="basenode-content Canvas">
				<canvas
					id="node-canvas"
					className="rounded"
					tabIndex="0"
				></canvas>
			</div>
		</div>
	);
}
