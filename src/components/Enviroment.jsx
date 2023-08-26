import SaveRestore from "./Graph";
import ReactFlow, { Background } from "reactflow";
import Editor from "./Editor";
import { FaChevronRight, FaNodeJs } from "react-icons/fa";
import {
	PiTextboxDuotone,
	PiHashDuotone,
	PiCircleDashedDuotone,
	PiBracketsSquareDuotone,
	PiBracketsCurlyDuotone,
} from "react-icons/pi";
import { TbBrandPython } from "react-icons/tb";
import { Splitter, SplitterPanel, SplitterResizeTrigger } from "@ark-ui/react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import useStore from "../utils/store";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
});

function Enviroment() {
	const { selectedNodeId } = useStore(selector, shallow);
	return (
		<>
			<ContextMenu.Root>
				<ContextMenu.Trigger className="ContextMenuTrigger">
					<Splitter
						defaultSize={[
							{ id: "a", size: 70 },
							{ id: "b", size: 30 },
						]}
					>
						<SplitterPanel id="a">
							<SaveRestore />
						</SplitterPanel>

						{selectedNodeId ? (
							<>
								<SplitterResizeTrigger id="a:b" />
								<SplitterPanel id="b">
									<Editor />
								</SplitterPanel>
							</>
						) : null}
					</Splitter>
				</ContextMenu.Trigger>

				<ContextMenu.Portal>
					<ContextMenu.Content
						className="ContextMenuContent"
						sideOffset={5}
						align="end"
					>
						<ContextMenu.Sub>
							<ContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Input nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</ContextMenu.SubTrigger>
							<ContextMenu.Portal>
								<ContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<ContextMenu.Item className="ContextMenuItem">
										<PiTextboxDuotone /> String node
									</ContextMenu.Item>
									<ContextMenu.Item className="ContextMenuItem">
										<PiHashDuotone /> String node
									</ContextMenu.Item>
								</ContextMenu.SubContent>
							</ContextMenu.Portal>
						</ContextMenu.Sub>

						{/* <ContextMenu.Separator className="ContextMenuSeparator" /> */}

						<ContextMenu.Sub>
							<ContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Boolean nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</ContextMenu.SubTrigger>
							<ContextMenu.Portal>
								<ContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<ContextMenu.Item className="ContextMenuItem">
										<PiCircleDashedDuotone /> Bool node
									</ContextMenu.Item>
								</ContextMenu.SubContent>
							</ContextMenu.Portal>
						</ContextMenu.Sub>

						{/* <ContextMenu.Separator className="ContextMenuSeparator" /> */}

						<ContextMenu.Sub>
							<ContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Shape nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</ContextMenu.SubTrigger>
							<ContextMenu.Portal>
								<ContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<ContextMenu.Item className="ContextMenuItem">
										<PiBracketsCurlyDuotone /> JSON node
									</ContextMenu.Item>
									<ContextMenu.Item className="ContextMenuItem">
										<PiBracketsSquareDuotone /> Array node
									</ContextMenu.Item>
								</ContextMenu.SubContent>
							</ContextMenu.Portal>
						</ContextMenu.Sub>

						{/* <ContextMenu.Separator className="ContextMenuSeparator" /> */}

						<ContextMenu.Sub>
							<ContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Function nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</ContextMenu.SubTrigger>
							<ContextMenu.Portal>
								<ContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<ContextMenu.Item className="ContextMenuItem">
										<TbBrandPython /> Python3 node
									</ContextMenu.Item>

									<ContextMenu.Item className="ContextMenuItem">
										<FaNodeJs /> Javascript node
									</ContextMenu.Item>
								</ContextMenu.SubContent>
							</ContextMenu.Portal>
						</ContextMenu.Sub>

						{/* <ContextMenu.Separator className="ContextMenuSeparator" /> */}

						<ContextMenu.Sub>
							<ContextMenu.SubTrigger className="ContextMenuSubTrigger">
								File nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</ContextMenu.SubTrigger>
							<ContextMenu.Portal>
								<ContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								></ContextMenu.SubContent>
							</ContextMenu.Portal>
						</ContextMenu.Sub>
					</ContextMenu.Content>
				</ContextMenu.Portal>
			</ContextMenu.Root>
		</>
	);
}

export default Enviroment;
