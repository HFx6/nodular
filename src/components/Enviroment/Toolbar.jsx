import React from "react";
import { Panel } from "reactflow";
import { RiInputMethodFill } from "react-icons/ri";
import { TbCircleDotFilled } from "react-icons/tb";
import { TbFunctionFilled } from "react-icons/tb";
import { MdDataArray } from "react-icons/md";
import { FaPaintRoller } from "react-icons/fa";


export default function functionNode() {
	const onDragStart = (event, nodeType) => {
		console.log(event, nodeType);
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};
	return (
		<Panel className="toolbar" position="bottom-center">
			<div className="controlbar">
				<div
					draggable
					onDragStart={(event) => onDragStart(event, "Input")}
				>
					<RiInputMethodFill />
				</div>
				<div
					draggable
					onDragStart={(event) => onDragStart(event, "Bool")}
				>
					<TbCircleDotFilled />
				</div>
				<div
					draggable
					onDragStart={(event) => onDragStart(event, "Function")}
				>
					<TbFunctionFilled />
				</div>
				<div
					draggable
					onDragStart={(event) => onDragStart(event, "Array")}
				>
					<MdDataArray />
				</div>
				<div
					draggable
					onDragStart={(event) => onDragStart(event, "Canvas")}
				>
					<FaPaintRoller />
				</div>
			</div>
		</Panel>
	);
}
