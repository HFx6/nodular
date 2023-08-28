import React, { useState, useEffect } from "react";
import CodeNode from "./CodeNode";
import { FaNodeJs } from "react-icons/fa";
import './JavascriptNode.css'

function JavascriptNode({ data, id }) {
	return (
		<CodeNode
			icon={<FaNodeJs />}
			name={data.label || `Function`}
			data={data}
			id={id}
		/>
	);
}

export default JavascriptNode;
