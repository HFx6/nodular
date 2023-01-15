// import CodeMirror, { useCodeMirror } from "@uiw/react-codemirror";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Panel } from "reactflow";
import { js as jBeautify } from "js-beautify";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { Icon } from "@iconify/react";
import { debounce } from "lodash";

import { shallow } from "zustand/shallow";
import useStore from "../utils/store";

const selector = (state) => ({
	updateEditorContent: state.updateEditorContent,
});

const extensions = [javascript({ jsx: true })];

function getArguments(func) {
	var funcName = func.match(/function(.*?)\(/)[1].trim();
	const ARROW = true;
	const FUNC_ARGS = ARROW
		? /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m
		: /^(function)\s*[^\(]*\(\s*([^\)]*)\)/m;
	const FUNC_ARG_SPLIT = /,/;
	const FUNC_ARG = /^\s*(_?)(.+?)\1\s*$/;
	const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

	return [
		((func || "").toString().replace(STRIP_COMMENTS, "").match(FUNC_ARGS) || [
			"",
			"",
			"",
		])[2]
			.split(FUNC_ARG_SPLIT)
			.map(function (arg) {
				return arg.replace(FUNC_ARG, function (all, underscore, name) {
					return name.split("=")[0].trim();
				});
			})
			.filter(String),
		funcName,
	];
}

export default function functionNode({ nodeData, setCurrentNode }) {
	const refEditor = useRef(null);
	const debounceUpdate = useRef(
		debounce(async (criteria) => {
			updateNode(criteria);
		}, 1000)
	).current;
	const updateNode = useCallback(
		(evn) => {
			var vals = getArguments(evn["func"]);
			updateEditorContent(evn["id"], {
				func: evn["func"],
				args: vals[0],
				label: vals[1],
			});
		},
		[nodeData?.data?.func]
	);

	useEffect(() => {
		console.log(nodeData);
		const view = new EditorView({
			doc: jBeautify(nodeData?.data?.func, {
				indent_size: 3,
				indent_with_tabs: true,
			}),
			extensions: [
				basicSetup,
				javascript({ jsx: true }),
				keymap.of([indentWithTab]),
				EditorView.updateListener.of((v) => {
					if (v.docChanged) {
						debounceUpdate({id:nodeData.id, func: v.state.doc.toString()});
					}
				}),
				vscodeDark,
			],
			parent: refEditor.current,
		});
		return () => {
			view.destroy();
		};
	}, [nodeData.id]);
	const { updateEditorContent } = useStore(selector, shallow);
	const closehandle = () => {
		setCurrentNode({});
	};

	return (
		<>
			<Panel className="editorpanel" position="top-right">
				<div className="funcnode">
					<div className="editorcontext">
						<p>{nodeData.data.label}()</p>
						{/* <p>open</p> */}
						{/* <p>save</p> */}
						<p>
							<Icon icon="carbon:magic-wand-filled" />
						</p>
						<p>
							<Icon icon="maki:cross" onClick={closehandle} />
						</p>
					</div>
					<div className="cmbody nodrag">
						<div ref={refEditor} />
					</div>
				</div>
			</Panel>
		</>
	);
}
