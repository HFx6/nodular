import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { insertTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { autocompletion, acceptCompletion } from "@codemirror/autocomplete";
import React, { useRef, useEffect } from "react";
import { js as jBeautify } from "js-beautify";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { shallow } from "zustand/shallow";
import useStore from "../utils/store";
import { debounce } from "lodash";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
	selectedNode: state.selectedNode,
	setSelectedNode: state.setSelectedNode,
	updateNodeData: (e) => state.updateNode(state.selectedNodeId, e),
});

const editor_lang = {
	node: javascript(),
	python: python(),
};

function Editor() {
	const { selectedNodeId, selectedNode, setSelectedNode, updateNodeData } =
		useStore(selector, shallow);

	const refEditor = useRef(null);

	const debounceUpdate = useRef(
		debounce(async (criteria) => {
			updateNodeData(criteria);
		}, 1000)
	).current;

	useEffect(() => {
		const editorContent = selectedNode.data?.funcedit
			? selectedNode.data.hasfunc
				? selectedNode.data.func
				: selectedNode.data.funceval
			: "non editable node";
		const editor_content = {
			node: jBeautify(editorContent, {
				indent_size: 2,
				indent_with_tabs: true,
			}),
			python: editorContent,
		};
		const view = new EditorView({
			doc: editor_content[selectedNode.data.lang] || editor_content.node,
			extensions: [
				basicSetup,
				editor_lang[selectedNode.data.lang] || editor_lang.node,
				keymap.of([
					{
						key: "Tab",
						run: (state, dispatch) => {
							if (state.selection && !state.selection.empty) {
								insertTab(state, dispatch);
								return true;
							}
							if (acceptCompletion(state, dispatch)) return true;
							return insertTab(state, dispatch);
						},
					},
				]),
				EditorView.updateListener.of((v) => {
					if (v.docChanged) {
						debounceUpdate({
							func: v.state.doc.toString(),
						});
					}
				}),
				vscodeDark,
				autocompletion(),
			],
			parent: refEditor.current,
			theme: "my-theme",
		});

		view.dom.style.height = "calc(100vh - 24px)";

		return () => {
			view.destroy();
		};
	}, [selectedNodeId]);

	const closeHandle = () => {
		setSelectedNode("");
	};
	const handleNameUpdate = (fname) => {
		var rg1 = /^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
		var rg2 = /^\./; // cannot start with dot (.)
		var rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
		if (rg1.test(fname) && !rg2.test(fname) && !rg3.test(fname)) {
			debounceUpdate({ label: fname });
		}else{
			console.log("invalid name")
		}
	};
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					position: "sticky",
					top: "0",
				}}
			>
				<input
					type="text"
					defaultValue={selectedNode.data.label}
					onChange={(e) => {
						handleNameUpdate(e.target.value);
					}}
					style={{ width: "50%" }}
				/>
				<div onClick={closeHandle} style={{ cursor: "pointer" }}>
					close
				</div>
			</div>
			<div ref={refEditor} />
		</div>
	);
}

export default Editor;
