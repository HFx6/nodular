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
	MenuContent,
	MenuItem,
	MenuPositioner,
	MenuTrigger,
	Portal,
} from "@ark-ui/react";
import { onPlay } from "../../utils/play";

function CodeNode({ icon, data, id }) {
	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		updateNodeInternals(data.id);
	}, [data?.args, data?.label]);

	const { setNodes } = useReactFlow();

	const deleteNodeById = (id) => {
		setNodes((nds) => nds.filter((node) => node.id !== id));
	};
	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => {
				return (
					<div
						className={`custom-node__select ${data.lang}-codenode`}
						key={i}
					>
						<div>{x}</div>
						<Handle key={x} type="target" position="left" id={x} />
					</div>
				);
			}),
		[data.args]
	);
	const sourceHandles = useMemo(
		() =>
			data?.returnArgs?.map((x, i) => {
				return (
					<div
						className={`custom-node__select ${data.lang}-codenode`}
						key={i}
					>
						<div>{x}</div>
						<Handle key={x} type="source" position="right" id={x} />
					</div>
				);
			}),
		[data.returnArgs]
	);
	return (
		<div className={`${data.lang}-code-container ${data.lang}-node`}>
			<div className={`${data.lang}-code-header`}>
				<div className={`${data.lang}-code-info`}>
					<div className={`${data.lang}-code-icon`}>{icon}</div>
					<div className={`${data.lang}-code-name`}>{data.label}</div>
				</div>
				<div
					className={`${data.lang}-code-options ignore-double-click nodrag`}
				>
					<div
						className={`${data.lang}-code-play`}
						onClick={(e) => onPlay(e, id)}
					>
						{data.loading ? (
							<PiSpinnerGapDuotone className="spinner" />
						) : (
							<PiPlayFill />
						)}
					</div>
					<div className={`${data.lang}-code-more`}>
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
			<div className={`${data.lang}-code-body`}>
				<div className="input-args">{targetHandles}</div>
				<div className="return">{sourceHandles}</div>
			</div>
		</div>
	);
}

export default CodeNode;
