import React, { useRef, useState, useEffect } from "react";
import { Handle } from "reactflow";
import { RiInputMethodFill } from "react-icons/ri";
import { Icon } from "@iconify/react";
import { debounce } from "lodash";

import useStore from "../utils/store";
import { shallow } from "zustand/shallow";

const selector = (id) => (state) => ({
  setInputValue: (e) => state.updateNode(id, { funceval: e }),
});

export default function FunctionNode({ id, data }) {
	const { setInputValue } = useStore(selector(id), shallow);
	
	const debounceUpdate = useRef(
		debounce(async (evn) => {
			setInputValue(evn);
		}, 1000)
	).current;

	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="source"
					position="right"
					style={{ backgroundColor: "#A0D468" }}
				/>
				{/* <RiInputMethodFill /> */}
				<Icon icon="ri:input-method-fill" />
			</div>
			<div className="input">
				<input
					className="nodrag"
					defaultValue={data.funceval}
					onChange={(evt) => debounceUpdate(evt.target.value)}
				/>
			</div>
		</div>
	);
}
