import React from "react";
import { Panel } from "reactflow";
import { Icon } from "@iconify/react";

export default function functionNode() {
	return (
		<Panel className="toolbar" position="bottom-center">
			<div className="controlbar">
				<Icon icon="ri:input-method-fill" />
				<Icon icon="mdi:circle-box" />
				<Icon icon="mdi:code-braces-box" />
				<Icon icon="mdi:code-array" />
				<Icon icon="material-symbols:image" />
				<Icon icon="mdi:file-document" />
			</div>
		</Panel>
	);
}
