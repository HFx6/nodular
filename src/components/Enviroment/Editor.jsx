import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import useStore from "../../utils/store";
import { shallow } from "zustand/shallow";

import toast from "react-hot-toast";

import { extractExports } from "./parse.js";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
	selectedNode: state.selectedNode,
	setSelectedNode: state.setSelectedNode,
	updateNodeData: (e) => state.updateNode(state.selectedNodeId, e),
});

export default function NodeEditor() {
	const { selectedNodeId, selectedNode, setSelectedNode, updateNodeData } =
		useStore(selector, shallow);
	const editorRef = useRef(null);
	const inputRef = useRef(null);

	function handleEditorDidMount(editor, monaco) {
		editorRef.current = editor;
	}

	function saveContent() {
		const returnArgs = extractExports(editorRef.current.getValue());

		updateNodeData({
			label: inputRef.current.value,
			func: editorRef.current.getValue(),
			returnArgs:
				returnArgs.length == 0
					? selectedNode.data.returnArgs
					: returnArgs,
		});
		toast.success("Node saved");
	}

	const closeHandle = () => {
		setSelectedNode("");
	};

	return (
		<>
			<button onClick={saveContent}>Save</button>
			<button onClick={closeHandle}>Close</button>

			<input
				type="text"
				defaultValue={selectedNode.data.label}
				ref={inputRef}
			/>
			<Editor
				height="100%"
				defaultLanguage="javascript"
				theme="vs-dark"
				defaultValue={
					selectedNode.data?.defaultNode
						? selectedNode.data.func
						: selectedNode.data.func
				}
				onMount={handleEditorDidMount}
			/>
		</>
	);
}
