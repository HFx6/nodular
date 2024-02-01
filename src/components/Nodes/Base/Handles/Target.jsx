import { Handle, useReactFlow } from "reactflow";
import { TbEdit } from "react-icons/tb";
import { MdDelete } from "react-icons/md";

import useStore from "../../../../utils/store";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
	removeTarget: (id, data) => state.removeTarget(id, data),
});

export default function Target({ lang, label, x, i, id }) {
	const { removeTarget } = useStore(selector, shallow);

	const reactFlow = useReactFlow();

	function onRemove() {
		reactFlow.deleteElements({
			edges: reactFlow
				.getEdges()
				.filter(
					(edge) => edge.target === id && edge.targetHandle === x
				),
		});

		removeTarget(id, i);
	}

	return (
		<div className={`custom-node__select ${lang}`} key={i}>
			<div className="target-select-label">{x}</div>
			<div className="edittarget">
				{/* <TbEdit /> */}
				<MdDelete onClick={() => onRemove()} />
			</div>
			<Handle key={x} type="target" position="left" id={x || label} />
		</div>
	);
}
