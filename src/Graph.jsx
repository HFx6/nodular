import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
	ReactFlowProvider,
	useNodesState,
	useEdgesState,
	addEdge,
	useReactFlow,
	MiniMap,
	Controls,
	Background,
	Panel,
	ControlButton,
} from "reactflow";
import { Icon } from "@iconify/react";

import NFunction from "./nodes/function";
import NBool from "./nodes/bool";
import NInput from "./nodes/input";

import Editor from "./panels/editor";
import Toolbar from "./panels/toolbar";

import { shallow } from "zustand/shallow";
import useStore from "./utils/store";

import "reactflow/dist/style.css";
import "./index.css";

const flowKey = "example-flow";

const getNodeId = () => `randomnode_${+new Date()}`;
const nodeTypes = {
	nodeFunction: NFunction,
	nodeBool: NBool,
	nodeInput: NInput,
};

const selector = (state) => ({
	nodes: state.nodes,
	edges: state.edges,
	onNodesChange: state.onNodesChange,
	onEdgesChange: state.onEdgesChange,
	onConnect: state.onConnect,
	setNodes: state.setNodes,
	setEdges: state.setEdges,
	onConnectEnd: state.onConnectEnd,
});

const SaveRestore = () => {
	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		setNodes,
		setEdges,
	} = useStore(selector, shallow);
	// const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	// const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [rfInstance, setRfInstance] = useState(null);
	const [currentNode, setCurrentNode] = useState({});
	const { setViewport } = useReactFlow();
	// const onConnectStart = (_, { nodeId, handleType }) =>
	// 	console.log("on connect start", { nodeId, handleType });
	// const onConnectEnd = (event) => console.log("on connect end", event);
	const onSave = useCallback(() => {
		if (rfInstance) {
			const flow = rfInstance.toObject();
			localStorage.setItem(flowKey, JSON.stringify(flow));
			// console.log(JSON.stringify(flow));
		}
	}, [rfInstance]);

	const onNodeDoubleClick = useCallback(
		(event, node) => {
			if (node.data.funcedit) {
				setCurrentNode(node);
			} else {
				setCurrentNode({});
			}
		},
		[currentNode]
	);

	const onRestore = useCallback(() => {
		const restoreFlow = async () => {
			const flow = JSON.parse(localStorage.getItem(flowKey));

			if (flow) {
				const { x = 0, y = 0, zoom = 1 } = flow.viewport;
				console.log();
				setNodes(flow.nodes || []);
				setEdges(flow.edges || []);
				setViewport({ x, y, zoom });
			}
		};

		restoreFlow();
	}, [setNodes, setViewport]);
	const onAdd = useCallback(() => {
		const newNode = {
			id: getNodeId(),
			data: { label: "Added node" },
			position: {
				x: Math.random() * window.innerWidth - 100,
				y: Math.random() * window.innerHeight,
			},
		};
		setNodes((nds) => nds.concat(newNode));
	}, [setNodes]);

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			onInit={setRfInstance}
			// onConnectStart={onConnectStart}
			// onConnectEnd={onConnectEnd}
			nodeTypes={nodeTypes}
			onNodeDoubleClick={onNodeDoubleClick}
			multiSelectionKeyCode={"Control"}
			selectionKeyCode={"Control"}
		>
			<Background
				color="#1F1F1F"
				style={{ backgroundColor: "#111111" }}
				size={3}
				gap={30}
			/>
			{currentNode?.data?.func ? (
				<Editor
					key={currentNode.data.id}
					nodeData={currentNode}
					setCurrentNode={setCurrentNode}
				/>
			) : null}
			<Toolbar />
			{/* <div className="save__controls">
				<button onClick={onSave}>save</button>
				<button onClick={onRestore}>restore</button>
				<button onClick={onAdd}>add node</button>
			</div> */}
			<MiniMap style={{ backgroundColor: "black" }} />
			<Controls>
				<ControlButton onClick={onRestore}>
					<Icon icon="material-symbols:drive-folder-upload" />
				</ControlButton>
				<ControlButton onClick={onSave}>
					<Icon icon="material-symbols:save-rounded" />
				</ControlButton>
			</Controls>
		</ReactFlow>
	);
};

export default () => (
	<ReactFlowProvider>
		<SaveRestore />
	</ReactFlowProvider>
);
