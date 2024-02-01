import { useMemo, useRef } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Source from "../Base/Handles/Source";

import "./style.css";

export default function Canvas({ data, id }) {
	const canvasRef = useRef(null);
	// console.log(canvasRef);
	const sourcehandles = useMemo(
		() =>
			data?.returnArgs?.map((x, i) => (
				<Source
					key={x}
					lang={data.lang}
					label={data.label}
					x={x}
					i={i}
				/>
			)),
		[data.returnArgs]
	);
	return (
		<div className="basenode-container Canvas">
			<div className={`basenode-header Canvas`}>
				<div className="basenode-label Canvas">{data.label}</div>
				<div className="basenode-icon Canvas">@</div>
			</div>
			<div className="basenode-content Canvas">
				<canvas
					id={id}
					ref={canvasRef}
					className="rounded"
					tabIndex="0"
				></canvas>
				<div className="basenode-footer">
					<div className="basenode-sources">{sourcehandles}</div>
				</div>
			</div>
		</div>
	);
}
