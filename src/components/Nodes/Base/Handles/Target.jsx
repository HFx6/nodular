import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

export default function Target({ lang, label, x, i }) {
	return (
		<div className={`custom-node__select ${lang}`} key={i}>
			<div className="target-select-label">{x}</div>
			<Handle key={x} type="target" position="left" id={x || label} />
		</div>
	);
}
