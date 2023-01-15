import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import React from "react";
import { Handle } from "reactflow";
import { js as jBeautify } from "js-beautify";
import { createTheme } from "thememirror";
import { tags as t } from "@lezer/highlight";
import { HiCodeBracketSquare } from "react-icons/hi2";
import { vscodeDark } from "@uiw/codemirror-theme-vscode"

export default function functionNode() {
	return (
		<div className="funcnode">
            <Handle
				id="a"
				type="source"
				position="top"
				style={{ background: "#555" }}
				onConnect={(params) => console.log("handle onConnect", params)}
			/>
			<div className="header">
					<p>open</p>
					<p>save</p>
					<p>format</p>
					<p>close</p>
					<p>isInArray()</p>
				
			</div>
			<div className="cmbody nodrag">
				<CodeMirror
					value={jBeautify("function isInArray(input,array){\n\
                            var bool = array.includes(input);\n\
                            return bool;\n\
                    }",
						{ indent_size: 3, indent_with_tabs: true }
					)}
					extensions={[javascript({ jsx: true })]}
					basicSetup={{
						allowMultipleSelections: false,
						indentOnInput: false,
					}}
					theme={vscodeDark}
				/>
			</div>
		</div>
	);
}
