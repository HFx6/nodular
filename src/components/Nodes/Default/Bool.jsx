import { useMemo } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Target from "../Base/Handles/Target";

import "./style.css";

export default function Bool({ data, type }) {
	const targetHandles = useMemo(
		() =>
			data?.args?.map((x, i) => (
				<Target
					key={x}
					lang={data.lang}
					label={data.label}
					x={String(data.funceval)}
					i={i}
				/>
			)),
		[data.args, data.funceval]
	);
	return (
		<Base label={data.label} type={type}>
			{/* <p>{String(data.funceval)}</p> */}
			<div className="basenode-footer">
				<div className="basenode-targets">
					{targetHandles}
				</div>
			</div>
		</Base>
	);
}
