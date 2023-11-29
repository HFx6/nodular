import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

export default function Source({ lang, label, x, i }) {
	return (
		<div className={`custom-node__select ${lang}`} key={i}>
			<div className="source-select-label">{x}</div>
			<Handle key={x}  type="source" position="right" id={x || label} />
		</div>
	);
}
