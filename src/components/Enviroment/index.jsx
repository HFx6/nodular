import { useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import NodularGraph from "./Graph";
import Editor from "./Editor";
import ResizeHandle from "./ResizeHandle";
import styles from "./styles.module.css";
import useStore from "../../utils/store";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
});

export default function Enviroment() {
	const { selectedNodeId } = useStore(selector, shallow);
	return (
		<>
			<PanelGroup autoSaveId="example" direction="horizontal">
				<Panel
					className={styles.Panel}
					collapsible={true}
					defaultSize={selectedNodeId ? 20 : 100}
					order={1}
					id="NodularGraph"
				>
					<NodularGraph />
				</Panel>
				{selectedNodeId && (
					<>
						<ResizeHandle />
						<Panel
						id="Editor"
							className={styles.Panel}
							collapsible={true}
							defaultSize={20}
							order={3}
						>
							<Editor />
						</Panel>
					</>
				)}
			</PanelGroup>
		</>
	);
}
