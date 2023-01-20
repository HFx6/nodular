import React, { useEffect } from "react";
import { Handle, useUpdateNodeInternals } from "reactflow";
import { FaDotCircle } from "react-icons/fa";
import { Icon } from "@iconify/react";

export default function functionNode({ data }) {
	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		console.log(data);
		updateNodeInternals(data.id);
	}, [data]);
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="target"
					position="left"
					style={{ background: "#555" }}
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
