import { FaChevronRight, FaNodeJs } from "react-icons/fa";
import {
	PiTextboxDuotone,
	PiHashDuotone,
	PiCircleDashedDuotone,
	PiBracketsSquareDuotone,
	PiBracketsCurlyDuotone,
} from "react-icons/pi";
import { TbBrandPython } from "react-icons/tb";

import * as RadixContextMenu from "@radix-ui/react-context-menu";


function ContextMenu({children}){
  return(
    <RadixContextMenu.Root>
				<RadixContextMenu.Trigger className="ContextMenuTrigger">
					{children}
				</RadixContextMenu.Trigger>

				<RadixContextMenu.Portal>
					<RadixContextMenu.Content
						className="ContextMenuContent"
						sideOffset={5}
						align="end"
					>
						<RadixContextMenu.Sub>
							<RadixContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Input nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</RadixContextMenu.SubTrigger>
							<RadixContextMenu.Portal>
								<RadixContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<RadixContextMenu.Item className="ContextMenuItem">
										<PiTextboxDuotone /> String node
									</RadixContextMenu.Item>
									<RadixContextMenu.Item className="ContextMenuItem">
										<PiHashDuotone /> String node
									</RadixContextMenu.Item>
								</RadixContextMenu.SubContent>
							</RadixContextMenu.Portal>
						</RadixContextMenu.Sub>

						{/* <RadixContextMenu.Separator className="ContextMenuSeparator" /> */}

						<RadixContextMenu.Sub>
							<RadixContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Boolean nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</RadixContextMenu.SubTrigger>
							<RadixContextMenu.Portal>
								<RadixContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<RadixContextMenu.Item className="ContextMenuItem">
										<PiCircleDashedDuotone /> Bool node
									</RadixContextMenu.Item>
								</RadixContextMenu.SubContent>
							</RadixContextMenu.Portal>
						</RadixContextMenu.Sub>

						{/* <RadixContextMenu.Separator className="ContextMenuSeparator" /> */}

						<RadixContextMenu.Sub>
							<RadixContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Shape nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</RadixContextMenu.SubTrigger>
							<RadixContextMenu.Portal>
								<RadixContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<RadixContextMenu.Item className="ContextMenuItem">
										<PiBracketsCurlyDuotone /> JSON node
									</RadixContextMenu.Item>
									<RadixContextMenu.Item className="ContextMenuItem">
										<PiBracketsSquareDuotone /> Array node
									</RadixContextMenu.Item>
								</RadixContextMenu.SubContent>
							</RadixContextMenu.Portal>
						</RadixContextMenu.Sub>

						{/* <RadixContextMenu.Separator className="ContextMenuSeparator" /> */}

						<RadixContextMenu.Sub>
							<RadixContextMenu.SubTrigger className="ContextMenuSubTrigger">
								Function nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</RadixContextMenu.SubTrigger>
							<RadixContextMenu.Portal>
								<RadixContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								>
									<RadixContextMenu.Item className="ContextMenuItem">
										<TbBrandPython /> Python3 node
									</RadixContextMenu.Item>

									<RadixContextMenu.Item className="ContextMenuItem">
										<FaNodeJs /> Javascript node
									</RadixContextMenu.Item>
								</RadixContextMenu.SubContent>
							</RadixContextMenu.Portal>
						</RadixContextMenu.Sub>

						{/* <RadixContextMenu.Separator className="ContextMenuSeparator" /> */}

						{/* <RadixContextMenu.Sub>
							<RadixContextMenu.SubTrigger className="ContextMenuSubTrigger">
								File nodes
								<div className="RightSlot">
									<FaChevronRight />
								</div>
							</RadixContextMenu.SubTrigger>
							<RadixContextMenu.Portal>
								<RadixContextMenu.SubContent
									className="ContextMenuSubContent"
									sideOffset={2}
									alignOffset={-5}
								></RadixContextMenu.SubContent>
							</RadixContextMenu.Portal>
						</RadixContextMenu.Sub> */}
					</RadixContextMenu.Content>
				</RadixContextMenu.Portal>
			</RadixContextMenu.Root>
  )
}

export default ContextMenu;