import React, { useRef, useState, useEffect } from "react";
import { Handle } from "reactflow";
import { RiInputMethodFill } from "react-icons/ri";
import { Icon } from "@iconify/react";
import { debounce } from "lodash";

import useStore from '../utils/store';

export default function functionNode({ id, data }) {
	const [inputVal, setInputVal] = useState(data.funceval);
	const didMountRef = useRef(false);
	const debounceUpdate = useRef(
		debounce(async (evn) => {
			updateInputValue(evn.id, evn.val);
		}, 1000)
	).current;

	useEffect(()=>{
		// console.log(didMountRef.current);
		if (didMountRef.current) { 
			debounceUpdate({id: id, val:inputVal});
		  }
		  didMountRef.current = true;
		
	}, [inputVal])

	const updateInputValue = useStore((state) => state.updateInputValue);
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="source"
					position="right"
					style={{backgroundColor: "#A0D468"}}
					
				/>
				{/* <RiInputMethodFill /> */}
				<Icon icon="ri:input-method-fill" />
			</div>
			<div className="input">
				<input className="nodrag" value={inputVal} onChange={(evt) => setInputVal(evt.target.value)}/>
			</div>
		</div>
	);
}
