import React, { useState } from "react";
import { Handle, useUpdateNodeInternals } from "reactflow";
import { FaDotCircle } from "react-icons/fa";
import { PiCaretDownDuotone } from "react-icons/pi";
import { Icon } from "@iconify/react";
import * as Collapsible from "@radix-ui/react-collapsible";

export default function ArrayNode({ data }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="nstring">
			<div className="idicon">
				<Handle
					type="source"
					position="right"
					style={{ backgroundColor: "#D19A66" }}
				/>
				{/* <FaDotCircle /> */}
				<Icon icon="mdi:code-array" />
			</div>
			<div className="boolresult">
				{/* <p>{data.label}</p> */}
				<Collapsible.Root
					className="CollapsibleRoot ignore-double-click"
					open={open}
					onOpenChange={setOpen}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<span className="Text" style={{ color: "white" }}>
							{data.label}
						</span>
						<Collapsible.Trigger asChild>
							<PiCaretDownDuotone />
						</Collapsible.Trigger>
					</div>

					<Collapsible.Content>
						{data.funceval.map((item, id) => (
							<div className="Repository" key={`${item}-${id}`}>
								<span className="Text">{item}</span>
							</div>
						))}
					</Collapsible.Content>
				</Collapsible.Root>
			</div>
		</div>
	);
}
