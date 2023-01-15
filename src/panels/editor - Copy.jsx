import CodeMirror, { useCodeMirror } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Panel } from "reactflow";
import { js as jBeautify } from "js-beautify";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { Icon } from "@iconify/react";

import { shallow } from "zustand/shallow";
import useStore from "../utils/store";

const selector = (state) => ({
	updateEditorContent: state.updateEditorContent,
});

const extensions = [javascript({ jsx: true })];

export default function functionNode({ nodeData, setCurrentNode }) {
	const editor = useRef();
	console.log(123);
	const onChange = useCallback((evn, nodeId) => {
		console.log("value:", nodeId, evn);
		updateEditorContent(nodeId, evn);
	}, [nodeData?.data?.func]);

	// const { setContainer } = useCodeMirror({
	// 	container: editor.current,
	// 	extensions,
	// 	value: jBeautify(nodeData?.data?.func, {
	// 		indent_size: 3,
	// 		indent_with_tabs: true,
	// 	}),
	// 	basicSetup: {
	// 		allowMultipleSelections: false,
	// 		indentOnInput: false,
	// 	},
	// 	theme: vscodeDark,
	// 	onChange: (evn) => onChange(evn, nodeData.id)
	//   });

	//   useEffect(() => {
	// 	if (editor.current) {
	// 	  setContainer(editor.current);
	// 	}
	//   }, [nodeData?.data?.func]);

	const { updateEditorContent } = useStore(selector, shallow);
	const closehandle = () => {
		setCurrentNode({});
	};
	
	const formatHandle = () => {
		function getArguments(func) {
			var funcName = func.match(/function(.*?)\(/)[1].trim();
			console.log("Function Name: " + funcName);
			const ARROW = true;
			const FUNC_ARGS = ARROW
				? /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m
				: /^(function)\s*[^\(]*\(\s*([^\)]*)\)/m;
			const FUNC_ARG_SPLIT = /,/;
			const FUNC_ARG = /^\s*(_?)(.+?)\1\s*$/;
			const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

			return ((func || "")
				.toString()
				.replace(STRIP_COMMENTS, "")
				.match(FUNC_ARGS) || ["", "", ""])[2]
				.split(FUNC_ARG_SPLIT)
				.map(function (arg) {
					return arg.replace(FUNC_ARG, function (all, underscore, name) {
						return name.split("=")[0].trim();
					});
				})
				.filter(String);
		}
		console.log(getArguments(nodeData.data.func));
	};

	return (
		<>
			<Panel className="editorpanel" position="top-right">
				<div className="funcnode">
					<div className="editorcontext">
						<p>isInArray()</p>
						{/* <p>open</p> */}
						{/* <p>save</p> */}
						<p>
							<Icon icon="carbon:magic-wand-filled" onClick={formatHandle} />
						</p>
						<p>
							<Icon icon="maki:cross" onClick={closehandle} />
						</p>
					</div>
					<div className="cmbody nodrag">
						{/* <CodeMirror
							value={jBeautify(nodeData?.data?.func, {
								indent_size: 3,
								indent_with_tabs: true,
							})}
							extensions={[javascript({ jsx: true })]}
							basicSetup={{
								allowMultipleSelections: false,
								indentOnInput: false,
							}}
							theme={vscodeDark}
							onChange={(evn) => onChange(evn, nodeData.id)}
						/> */}
						<div ref={editor} />
					</div>
				</div>
			</Panel>
		</>
	);
}
