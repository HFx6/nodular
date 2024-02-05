import { useMemo, useEffect } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import toast from "react-hot-toast";

import Source from "../Base/Handles/Source";
import Target from "../Base/Handles/Target";

import "./style.css";

import useStore from "../../../utils/store";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
	addTarget: (id, arg) => state.addTarget(id, arg),
});

export default function Function({ data, type, id }) {
	const { addTarget } = useStore(selector, shallow);
	const updateNodeInternals = useUpdateNodeInternals();

	useEffect(() => {
		updateNodeInternals(id);
	}, [data.args, data.returnArgs]);

	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => (
				<Target
					key={x}
					id={id}
					lang={data.lang}
					label={data.label}
					x={x}
					i={i}
				/>
			)),
		[data?.args]
	);
	const sourceHandles = useMemo(
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
	function addInput() {
		const input = prompt("Enter input name");
		const result = addTarget(id, input);
		if (result?.error) {
			toast.error(result.error);
		} else {
			toast.success(`${input} added`);
		}
	}
	return (
		<Base label={data.label} type={type} lang={data.lang}>
			<div className="basenode-targets function-node">
				{targetHandles}
			</div>
			<div className="basenode-footer">
				<div
					className="basenode-add-target nodrag"
					onClick={() => addInput()}
				>
					<div className="icon-button">+</div>
				</div>

				<div className="basenode-sources">{sourceHandles}</div>
			</div>
		</Base>
	);
}
