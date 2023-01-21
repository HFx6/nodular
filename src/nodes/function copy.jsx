import { useUpdateNodeInternals } from "reactflow";
import React, { useMemo, useEffect } from "react";
import { Handle } from "reactflow";
import { Icon } from "@iconify/react";

export default function functionNode({ data }) {
	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		updateNodeInternals(data.id);
	}, [data?.args]);
	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => {
				// const handleId = `target-handle-${i + 1}`;
				// console.log(x, i);
				return (
					// <p className="handletext" key={i}>{x}</p>
					// <Handle
					// 	key={x}
					// 	type="target"
					// 	position="left"
					// 	id={x}
					// 	style={{ top: i * 30 }}
					// />
					<div className="custom-node__select" key={i}>
						<div>{x}</div>
						<Handle key={x} type="target" position="left" id={x} />
					</div>
				);
			}),
		[data.args]
	);

	return (
		<>
			<div className="custom-node__header funcnode">
				<div className="header">
					<div className="idicon">
						<Icon icon="mdi:code-braces-box" />
					</div>
					<div className="label">
						<p>{data.label || `Function`}()</p>
					</div>
				</div>
			</div>
			<div className="custom-node__body">{targetHandles}</div>
		</>
	);
}
