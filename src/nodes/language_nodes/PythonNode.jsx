import React, { useState, useEffect } from "react";
import CodeNode from "./CodeNode";
import { TbBrandPython } from "react-icons/tb";
import './PythonNode.css';

function PythonNode({ data, id }) {
	return (
		<CodeNode
			icon={<TbBrandPython />}
			name={data.label || `Function`}
			data={data}
			id={id}
		/>
	);
}

export default PythonNode;
