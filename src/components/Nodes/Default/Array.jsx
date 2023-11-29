import { useMemo } from "react";
import Base from "../Base/Base";

import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";

import Source from "../Base/Handles/Source";

import "./style.css";

export default function Array({ data, type }) {
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
	return (
		<Base label={data.label} type={type}>
			<div className="basenode-footer">
				<div className="basenode-sources">{sourcehandles}</div>
			</div>
		</Base>
	);
}
