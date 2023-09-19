import { useEffect, useMemo } from "react";
import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";
import "./CanvasNode.css";
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
import { onPlay } from "../../utils/play";

function CanvasNode({ data, id }) {
	return (
		<div className={`${data.label}-code-container ${data.label}-node`}>
			<div className={`${data.label}-code-header`}>
				<div className={`${data.label}-code-info`}>
					<div className={`${data.label}-code-name`}>
						{data.label}
					</div>
				</div>
				<div
					className={`${data.label}-code-options ignore-double-click nodrag`}
				>
					<div className={`${data.label}-code-play`}>
						{data.loading ? (
							<PiSpinnerGapDuotone className="spinner" />
						) : (
							<PiPlayFill />
						)}
					</div>
					<div className={`${data.label}-code-more`}>
						<Menu>
							<MenuTrigger>
								<PiDotsThreeOutlineFill />
							</MenuTrigger>
							<Portal>
								<MenuPositioner>
									<MenuContent>
										<MenuItem id="edit">Edit</MenuItem>
										<MenuItem id="delete">Delete</MenuItem>
									</MenuContent>
								</MenuPositioner>
							</Portal>
						</Menu>
					</div>
				</div>
			</div>
			<div className={`${data.label}-code-body`}>
				<canvas
					id="node-canvas"
					className="rounded"
					width="640"
					height="400"
					tabIndex="0"
				></canvas>
			</div>
		</div>
	);
}

export default CanvasNode;
