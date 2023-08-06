import SaveRestore from "./Graph";
import ReactFlow, { Background } from "reactflow";
import Editor from "./Editor";
import { Splitter, SplitterPanel, SplitterResizeTrigger } from "@ark-ui/react";
import useStore from "../utils/store";
import { shallow } from "zustand/shallow";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
});

function Enviroment() {
	const { selectedNodeId } = useStore(selector, shallow);
	return (
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
	);
}

export default Enviroment;
