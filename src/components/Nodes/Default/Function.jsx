import { useMemo, useEffect } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Source from "../Base/Handles/Source";
import Target from "../Base/Handles/Target";

import "./style.css";

import useStore from "../../../utils/store";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
	updateNodeData: (id, data) => state.updateNode(id, data),
});

export default function Function({ data, type, id }) {
	const { updateNodeData } = useStore(selector, shallow);
	const updateNodeInternals = useUpdateNodeInternals();

	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => (
				<Target
					key={x}
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
		updateNodeData(id, {
			args: [...data.args, "input " + (data.args.length + 1)],
		});
	}
	return (
		<Base label={data.label} type={type}>
			<div className="basenode-targets function-node">{targetHandles}</div>
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
