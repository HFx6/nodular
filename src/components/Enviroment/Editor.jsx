import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import useStore from "../../utils/store";
import { shallow } from "zustand/shallow";

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

	function handleEditorDidMount(editor, monaco) {
		editorRef.current = editor;
	}

	function showValue() {
		updateNodeData({ func: editorRef.current.getValue() });
	}

	const closeHandle = () => {
		setSelectedNode("");
	};

	return (
		<>
			<button onClick={showValue}>Save</button>
			<button onClick={closeHandle}>Close</button>
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
