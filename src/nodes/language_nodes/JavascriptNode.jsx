import React, { useState, useEffect, useRef, useMemo } from "react";
import CodeNode from "./CodeNode";
import { FaNodeJs } from "react-icons/fa";
import "./JavascriptNode.css";

function JavascriptNode({ data, id }) {
	const Node = useMemo(() => {
		return (
			<CodeNode
				data={data}
				id={id}
				language="javascript"
				icon={<FaNodeJs />}
			/>
		);
	}, [data, id]);
	return <>{Node}</>;
}

export default JavascriptNode;
