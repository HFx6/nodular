import React, { useEffect } from "react";
import { Handle, useUpdateNodeInternals } from "reactflow";
import { FaDotCircle } from "react-icons/fa";
import { Icon } from "@iconify/react";

export default function boolNode({ data }) {
	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		console.log(data);
		updateNodeInternals(data.id);
	}, [data.funceval]);
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="target"
					position="left"
					style={data.argTypeColors[0]}
				/>
				{/* <FaDotCircle /> */}
				<Icon icon="mdi:circle-box" />
			</div>
			<div className="boolresult">
				<p>{String(data.funceval)}</p>
			</div>
		</div>
	);
}
