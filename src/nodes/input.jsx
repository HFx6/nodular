import React from "react";
import { Handle } from "reactflow";
import { RiInputMethodFill } from "react-icons/ri";
import { Icon } from "@iconify/react";

import useStore from '../utils/store';

export default function functionNode({ id, data }) {
	const updateInputValue = useStore((state) => state.updateInputValue);
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="source"
					position="right"
					style={{ background: "#555" }}
				/>
				{/* <RiInputMethodFill /> */}
				<Icon icon="ri:input-method-fill" />
			</div>
			<div className="input">
				<input className="nodrag" value={data.funceval} onChange={(evt) => updateInputValue(id, evt.target.value)}/>
			</div>
		</div>
	);
}
