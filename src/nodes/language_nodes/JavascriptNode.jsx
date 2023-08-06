import React, { useState, useEffect } from "react";
import CodeNode from "./CodeNode";
import { FaNodeJs } from "react-icons/fa";

function JavascriptNode({ data, id }) {

	const playFromNode = (id) => {
		console.log(id);
	};
	return (
		<CodeNode
			icon={<FaNodeJs />}
			name={"isinarray()"}
			data={data}
			id={id}
			playCallback={() => playFromNode(id)}
		/>
	);
}

export default JavascriptNode;
