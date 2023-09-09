import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import React, { useRef, useEffect } from "react";
import { js as jBeautify } from "js-beautify";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { shallow } from "zustand/shallow";
import useStore from "../utils/store";
import { debounce } from "lodash";
import { functionArgs } from "../utils/language_parsers/javascript";
import { ato_run } from "../utils/client/ato";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
	selectedNode: state.selectedNode,
	setSelectedNode: state.setSelectedNode,
	updateNodeData: (e) => state.updateNode(state.selectedNodeId, e),
});
// const code = `function isinarray(input, array) {\n\tvar bool = array.includes(input);\n\treturn bool;\n}`;

const editor_lang = {
	node: javascript(),
	python: python(),
};

function Editor() {
	const { selectedNodeId, selectedNode, setSelectedNode, updateNodeData } =
		useStore(selector, shallow);

	const refEditor = useRef(null);
	console.log(editor_lang, selectedNode.data.lang);

	const debounceUpdate = useRef(
		debounce(async (criteria) => {
			if(criteria.func) console.log(functionArgs(criteria.func));
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
				keymap.of([indentWithTab]),
				EditorView.updateListener.of((v) => {
					if (v.docChanged) {
						debounceUpdate({
							func: v.state.doc.toString(),
						});
					}
				}),
				vscodeDark,
			],
			parent: refEditor.current,
		});
		return () => {
			view.destroy();
		};
	}, [selectedNodeId]);

	const closeHandle = () => {
		setSelectedNode("");
	};

	return (
		<>
			{/* input for the label */}
			<input
				type="text"
				defaultValue={selectedNode.data.label}
				onChange={(e) => {
					debounceUpdate({ label: e.target.value });
				}}
			/>

			<div onClick={closeHandle} style={{ top: "0", position: "sticky" }}>
				close
			</div>
			<div ref={refEditor} />
		</>
	);
}

export default Editor;
