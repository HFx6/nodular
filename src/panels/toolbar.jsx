import React from "react";
import { Panel } from "reactflow";
import { Icon } from "@iconify/react";

export default function functionNode() {
	const onDragStart = (event, nodeType) => {
		console.log(123);
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};
	return (
		<Panel className="toolbar" position="bottom-center">
			<div className="controlbar">
				<div draggable onDragStart={(event) => onDragStart(event, "nodeInput")}>
					<Icon icon="ri:input-method-fill" />
				</div>
				<div draggable onDragStart={(event) => onDragStart(event, "nodeBool")}>
					<Icon icon="mdi:circle-box" />
				</div>
				<div draggable onDragStart={(event) => onDragStart(event, "nodeFunction")}>
					<Icon icon="mdi:code-braces-box" />
				</div>
				<div draggable onDragStart={(event) => onDragStart(event, "nodeArray")}>
					<Icon icon="mdi:code-array" />
				</div>
				<div draggable onDragStart={(event) => onDragStart(event, "nodeBool")}>
					<Icon icon="material-symbols:image" />
				</div>
				<div draggable onDragStart={(event) => onDragStart(event, "nodeBool")}>
					<Icon icon="mdi:file-document" />
				</div>
			</div>
		</Panel>
	);
}
