import React, { useEffect } from "react";
import { Handle, useUpdateNodeInternals } from "reactflow";
import { FaDotCircle } from "react-icons/fa";
import { Icon } from "@iconify/react";

export default function arrayNode({ data }) {
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="source"
					position="right"
					style={{backgroundColor: "#D19A66"}}
				/>
				{/* <FaDotCircle /> */}
				<Icon icon="mdi:code-array" />
			</div>
			<div className="boolresult">
				<p>{data.label}</p>
			</div>
		</div>
	);
}
