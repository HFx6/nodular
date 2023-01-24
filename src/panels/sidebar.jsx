import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Panel } from "reactflow";

import { shallow } from "zustand/shallow";
import useStore from "../utils/store";

export default function sidebar() {
	return (
		<>
			<Panel className="treeview" position="top-left">
			{/* https://codesandbox.io/s/async-skill-tree-07-graph-ksjxkj?file=/src/hooks/useStore.ts */}
			</Panel>
		</>
	);
}
