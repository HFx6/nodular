import { useEffect, useMemo } from "react";
import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";
import "./CodeNode.css";
import {
	PiPlayFill,
	PiDotsThreeOutlineFill,
	PiSpinnerGapDuotone,
} from "react-icons/pi";
import {
	Menu,
	MenuArrow,
	MenuArrowTip,
	MenuContent,
	MenuContextTrigger,
	MenuItem,
	MenuItemGroup,
	MenuItemGroupLabel,
	MenuOptionItem,
	MenuPositioner,
	MenuSeparator,
	MenuTrigger,
	MenuTriggerItem,
	Portal,
} from "@ark-ui/react";

function CodeNode({ name, icon, data, playCallback, id }) {
	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		updateNodeInternals(data.id);
	}, [data?.args, data?.label]);

	const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

	const deleteNodeById = (id) => {
		setNodes((nds) => nds.filter((node) => node.id !== id));
	};
	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => {
				return (
					<div className="custom-node__select codenode" key={i}>
						<div>{x}</div>
						<Handle key={x} type="target" position="left" id={x} />
					</div>
				);
			}),
		[data.args]
	);
	return (
		<div className={`code-container ${data.lang}-node`}>
			<div className="code-header">
				<div className="code-info">
					<div className="code-icon">{icon}</div>
					<div className="code-name">{data.label}</div>
				</div>
				<div className="code-options ignore-double-click nodrag">
					<div className="code-play" onClick={playCallback}>
						{data.loading ? (
							<PiSpinnerGapDuotone className="spinner" />
						) : (
							<PiPlayFill />
						)}
					</div>
					<div className="code-more">
						<Menu>
							<MenuTrigger>
								<PiDotsThreeOutlineFill />
							</MenuTrigger>
							<Portal>
								<MenuPositioner>
									<MenuContent>
										<MenuItem id="edit">Edit</MenuItem>
										<MenuItem
											id="delete"
											onClick={() => deleteNodeById(id)}
										>
											Delete
										</MenuItem>
									</MenuContent>
								</MenuPositioner>
							</Portal>
						</Menu>
					</div>
				</div>
			</div>
			<div className="code-body">
				<div className="input-args">
					{targetHandles}
					{/* <div className="custom-node__select codenode">
						<div>input</div>
						<Handle type="target" position="left" id="input" />
					</div>
					<div className="custom-node__select codenode">
						<div>array</div>
						<Handle type="target" position="left" id="array" />
					</div> */}
				</div>
				<div className="return">
					<div className="custom-node__select codenode">
						<div>return</div>
						<Handle type="source" position="right" id="return" />
					</div>
				</div>
			</div>
		</div>
	);
}

export default CodeNode;
