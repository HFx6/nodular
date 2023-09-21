import NodularGraph from "./Graph";
import Editor from "./Editor";
import React, { useEffect, useState } from "react";
import { Splitter, SplitterPanel, SplitterResizeTrigger } from "@ark-ui/react";
import { GoGrabber } from "react-icons/go";
import useStore from "../utils/store";
import { shallow } from "zustand/shallow";
import ContextMenu from "./ContextMenu";

const selector = (state) => ({
	selectedNodeId: state.selectedNodeId,
});

function Enviroment() {
	const { selectedNodeId } = useStore(selector, shallow);
	return (
		<ContextMenu>
			<Splitter
				defaultSize={[
					{ id: "a", size: 70 },
					{ id: "b", size: 30 },
				]}
			>
				<SplitterPanel id="a">
					<NodularGraph />
				</SplitterPanel>

				{selectedNodeId ? (
					<>
						<SplitterResizeTrigger id="a:b" asChild>
							<GoGrabber />
						</SplitterResizeTrigger>
						<SplitterPanel id="b">
							<Editor />
						</SplitterPanel>
					</>
				) : null}
			</Splitter>
		</ContextMenu>
	);
}

export default Enviroment;
