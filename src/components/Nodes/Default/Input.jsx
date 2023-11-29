import { useMemo } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Source from "../Base/Handles/Source";

import Editor from "@monaco-editor/react";

import "./style.css";

export default function Input({ data, type }) {
	const sourcehandles = useMemo(
		() =>
			data?.returnArgs?.map((x, i) => (
				<Source
					key={x}
					lang={data.lang}
					label={data.label}
					x={x}
					i={i}
				/>
			)),
		[data.returnArgs]
	);
	return (
		<Base label={data.label} type={type}>
			<Editor
				className="nodrag"
				options={{
					minimap: { enabled: false },
					glyphMargin: false,
					folding: false,
					codeLens: false,
					colorDecorators: false,
					selectionHighlight: false,
					lineDecorationsWidth: 10,
					lineNumbersMinChars: 2,
				}}
				height="2rem"
				theme="vs-dark"
				defaultValue="Yellow"
			/>
			<div className="basenode-footer">
				<div className="basenode-sources">{sourcehandles}</div>
			</div>
		</Base>
	);
}
