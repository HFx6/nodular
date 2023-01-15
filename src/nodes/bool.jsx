import React from "react";
import { Handle } from "reactflow";
import { FaDotCircle } from "react-icons/fa";
import { Icon } from "@iconify/react";

export default function functionNode({ data }) {
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="target"
					position="left"
					style={{ background: "#555" }}
					onConnect={(params) => console.log("handle onConnect", params)}
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
