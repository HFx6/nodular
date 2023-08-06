import React, { useMemo, useEffect } from "react";
import { useUpdateNodeInternals } from "reactflow";
import { Handle } from "reactflow";
import { Icon } from "@iconify/react";

export default function FunctionNode({ data }) {
	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		console.log(123);
		updateNodeInternals(data.id);
	}, [data?.args, data.label]);
	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => {
				// const handleId = `target-handle-${i + 1}`;
				// console.log(data.types, i, x, data.types[i]);
				return (
					// <p className="handletext" key={i}>{x}</p>
					// <Handle
					// 	key={x}
					// 	type="target"
					// 	position="left"
					// 	id={x}
					// 	style={{ top: i * 30 }}
					// />
					<div className="custom-node__select funcin" key={i}>
						<div>{x}</div>
						<Handle key={x} type="target" style={data.argTypeColors[i]} position="left" id={x} />
					</div>
				);
			}),
		[data.args]
	);

	return (
		<div className="funcnode">
			<div className="custom-node__header ">
				<div className="header">
					<div className="idicon">
						<Icon icon="mdi:code-braces-box" />
					</div>
					<div className="label">
						<p>{data.label || `Function`}()</p>
					</div>
				</div>
			</div>
			<div className="custom-node__body">
				{targetHandles}
				<div className="custom-node__select funcout">
					<div style={{paddingRight: '10px'}}>output</div>
					<Handle type="source" position="right" style={data.returnTypeColor}/>
				</div>
			</div>
		</div>
	);
}
