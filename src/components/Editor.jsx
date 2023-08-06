import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import React, { useMemo, seState, useCallback, useRef, useEffect } from "react";
import { js as jBeautify } from "js-beautify";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { shallow } from "zustand/shallow";
import useStore from "../utils/store";
import { debounce } from "lodash";
import { functionArgs as jsFunctionArgs } from "../utils/language_parsers/javascript";
import { ato_run } from "../utils/client/ato";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
	selectedNode: state.selectedNode,
	setSelectedNode: state.setSelectedNode,
	updateEditorContent: state.updateEditorContent,
});
const code = `function isinarray(input, array) {\n\tvar bool = array.includes(input);\n\treturn bool;\n}`;

function Editor() {
	const { selectedNodeId, selectedNode, setSelectedNode } = useStore(
		selector,
		shallow
	);

	// const args = useMemo(() => {
	// 	return jsFunctionArgs(code);
	// }, []);
	const refEditor = useRef(null);
	const debounceUpdate = useRef(
		debounce(async (criteria) => {
			updateNode(criteria);
		}, 1000)
	).current;

	const updateNode = useCallback(
		(evn) => {
			// var vals = evn.data.args;
			// const _types = getJSDocTypes(evn["func"]);
			// var argTypeColors = [];
			// console.log(_types);
			// for (const type of _types.argTypes || []) {
			// 	argTypeColors.push(handleTypes[type]);
			// }
			updateEditorContent(evn["id"], {
				label: jsFunctionArgs(evn["func"]).functionName,
				func: evn["func"],
				args: jsFunctionArgs(evn["func"]).args,
			});
		},
		[selectedNode?.data?.func]
	);
	// useEffect(() => {
	// 		(async () => {
	// 			const output = await ato_run();
	// 			console.log("Final Output:", output);
	// 		})();
	// 	}, []);
	useEffect(() => {
		const view = new EditorView({
			doc: jBeautify(selectedNode?.data?.func || code, {
				indent_size: 2,
				indent_with_tabs: true,
			}),
			extensions: [
				basicSetup,
				javascript({ jsx: true, typescript: true }),
				keymap.of([indentWithTab]),
				EditorView.updateListener.of((v) => {
					if (v.docChanged) {
						debounceUpdate({
							id: selectedNodeId,
							func: v.state.doc.toString(),
						});
					}
				}),
				vscodeDark,
			],
			parent: refEditor.current,
		});
		// (async () => {
		// 	const output = await ato_run(selectedNode?.data?.func || code);
		// 	console.log("Final Output:", output);
		// })();
		return () => {
			view.destroy();
		};
	}, [selectedNodeId]);
	const { updateEditorContent } = useStore(selector, shallow);
	const closehandle = () => {
		setSelectedNode("");
	};
	return (
		<>
			<div onClick={closehandle}>close</div>
			<div ref={refEditor} />
		</>
	);
}

export default Editor;
