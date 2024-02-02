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
	updateNodeData: (e) =>
		state.updateNode({ id: state.selectedNodeId, data: e }),
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
		if (selectedNode.type == "Input") {
			updateNodeData({
				label: inputRef.current.value,
				func: editorRef.current.getValue(),
			});
		}
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
				value={selectedNode.data.label}
				ref={inputRef}
			/>
			<Editor
				height="100%"
				language={selectedNode.data.lang}
				theme="vs-dark"
				defaultValue=""
				value={selectedNode.data.func}
				onMount={handleEditorDidMount}
			/>
		</>
	);
}
