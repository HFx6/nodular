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
					<Handle
						key={x}
						type="target"
						position="left"
						id={x}
						style={{ top: i * 30 }}
					/>
				);
			}),
		[data.args]
	);

	return (
		<div className="funcnode">
			{targetHandles}
			{/* <Handle
				id="a"
				type="target"
				position="left"
				style={{ background: "#555" }}
				onConnect={(params) => console.log("handle onConnect", params)}
			/>
			<Handle
				id="b"
				type="target"
				position="left"
				style={{ background: "#555", top: "20px" }}
				onConnect={(params) => console.log("handle onConnect", params)}
			/> */}
			<Handle
				type="source"
				position="right"
				style={{ background: "#555", top: "20px" }}
				onConnect={(params) => console.log("handle onConnect", params)}
			/>
			<div className="header">
				<div className="idicon">
					{/* <HiCodeBracketSquare /> */}
					<Icon icon="mdi:code-braces-box" />
				</div>
				<div className="label">
					<p>{data.label || `Function`}()</p>
				</div>
				
				{/* <div className="outputs">{sourceHandles}</div> */}
			</div>
			<div className="inputs">
					{data.args.map((x,i) => (
						<p key={i}>{x}</p>
					))}
				</div>
		</div>
	);
}