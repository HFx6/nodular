import { useMemo } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Source from "../Base/Handles/Source";

import toast from "react-hot-toast";

import useStore from "../../../utils/store";
import { shallow } from "zustand/shallow";

import "./style.css";

const selector = (state) => ({
	updateNodeData: (e) => state.updateNode(e),
});

const debounce = (callback, wait) => {
	let timeoutId = null;
	return (...args) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => {
			callback(...args);
			console.log("debounce");
		}, wait);
	};
};

export default function Input({ data, type, id }) {
	const { updateNodeData } = useStore(selector, shallow);
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

	const updateInput = debounce((e) => {
		updateNodeData({ id, data: { func: e.target.value } });
		toast.success("Input updated", {
			id: 'input-update',
		});
	}, 250);

	return (
		<Base label={data.label} type={type}>
			<textarea
				className="nodrag input-textarea"
				defaultValue={data.func}
				onChange={updateInput}
			/>
			<div className="basenode-footer">
				<div className="basenode-sources">{sourcehandles}</div>
			</div>
		</Base>
	);
}
