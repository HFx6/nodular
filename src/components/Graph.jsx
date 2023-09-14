import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { PiPlayFill } from "react-icons/pi";
import { nodeTypes } from "./graph_init";

import { shallow } from "zustand/shallow";
import nodeDefaults from "../init/nodedefaults";
import Toolbar from "../panels/toolbar";

import useStore from "../utils/store";
import { onPlay } from "../utils/play";

import "reactflow/dist/style.css";

const flowKey = "nodular_schema";

const selector = (state) => ({
	nodes: state.nodes,
	edges: state.edges,
	onNodesChange: state.onNodesChange,
	onEdgesChange: state.onEdgesChange,
	onConnect: state.onConnect,
	setEdges: state.setEdges,
	setNodes: state.setNodes,
	onConnectEnd: state.onConnectEnd,
	setSelectedNode: state.setSelectedNode,
	updateLoading: state.updateLoading,
	topo: state.topo,
});

const getId = () => `nodular_${+new Date()}`;

function NodularGraph() {
	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		setNodes,
		setEdges,
		setSelectedNode,
		updateLoading,
		topo,
	} = useStore(selector, shallow);

	const { getNode, getNodes, getEdges, toObject } = useReactFlow();
	const [rfInstance, setRfInstance] = useState(null);
	const { setViewport } = useReactFlow();

	const updateLoadingCallback = (id, loading) => {
		updateLoading(id, loading);
	};
	const onSave = useCallback(() => {
		if (rfInstance) {
			const flow = rfInstance.toObject();
			localStorage.setItem(flowKey, JSON.stringify(flow));
			// console.log(JSON.stringify(flow));
		}
	}, [rfInstance]);

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
	const onNodeDoubleClick = (event, node) => {
		// Get the target element of the event
		const targetElement = event.target;

		// Check if the double click happened on an element or any of its parents with the class "ignore-double-click"
		const ignoreDoubleClick =
			targetElement.closest(".ignore-double-click") !== null;

		if (!ignoreDoubleClick) {
			setSelectedNode(node.id);
		}
	};

	const onDragOver = useCallback((event) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(event) => {
			event.preventDefault();

			//   const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
			const type = event.dataTransfer.getData("application/reactflow");

			// check if the dropped element is valid
			if (typeof type === "undefined" || !type) {
				return;
			}

			const position = rfInstance.project({
				x: event.clientX,
				y: event.clientY,
			});
			console.log(nodeDefaults[type].data);

			const newNode = {
				id: getId(),
				type,
				position,
				data: { ...nodeDefaults[type].data },
			};

			setNodes([...nodes, newNode]);
			// setNodes((nds) => nds.concat(newNode));
		},
		[rfInstance, nodes]
	);

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onInit={setRfInstance}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			nodeTypes={nodeTypes}
			onNodeDoubleClick={onNodeDoubleClick}
			multiSelectionKeyCode={"Control"}
			selectionKeyCode={"Control"}
			onDrop={onDrop}
			minZoom={0.2}
			onDragOver={onDragOver}
			fitView
		>
			<Background
				color="#1F1F1F"
				style={{ backgroundColor: "#111111" }}
				size={3}
				gap={30}
			/>
			<Toolbar />
			<MiniMap
				style={{ backgroundColor: "black" }}
				position={"bottom-left"}
			/>
			<Controls position={"top-left"}>
				<ControlButton onClick={onRestore}>
					<Icon icon="material-symbols:drive-folder-upload" />
				</ControlButton>
				<ControlButton onClick={onSave}>
					<Icon icon="material-symbols:save-rounded" />
				</ControlButton>

				<ControlButton onClick={onPlay}>
					<PiPlayFill style={{ color: "#A0D468" }} />
				</ControlButton>
			</Controls>
		</ReactFlow>
	);
}

export default NodularGraph;
