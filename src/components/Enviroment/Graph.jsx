import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
	useReactFlow,
	MiniMap,
	Controls,
	Background,
	ControlButton,
} from "reactflow";
import { shallow } from "zustand/shallow";

import { onPlay } from "../../utils/play";

import useStore from "../../utils/store";

import { FaPlay } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import { FaFolderOpen } from "react-icons/fa";

import * as esbuild from "esbuild-wasm";

import esbuildasmsrc from "esbuild-wasm/esbuild.wasm?url";

import Toolbar from "./Toolbar";

import nodeDefaults from "../../utils/init/node_defaults";

// import Marker from './Marker';

import "./style.css";

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

// import Base from "../Nodes/Base/Base";

import Array from "../Nodes/Default/Array";
import Bool from "../Nodes/Default/Bool";
import Function from "../Nodes/Default/Function";
import Input from "../Nodes/Default/Input";
import Canvas from "../Nodes/Default/Canvas";

import ContextMenu from "../Nodes/Base/ContextMenu";

const nodeTypes = { Array, Bool, Function, Input, Canvas };

const flowKey = "nodular_schema";

const getId = () => `nodular_${+new Date()}`;

function Flow() {
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
	const ref = useRef(null);
	const [menu, setMenu] = useState(null);
	const onSave = useCallback(() => {
		if (rfInstance) {
			const flow = rfInstance.toObject();
			localStorage.setItem(flowKey, JSON.stringify(flow));
			// console.log(JSON.stringify(flow));
		}
	}, [rfInstance]);
	const { setViewport } = useReactFlow();
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
	useEffect(() => {
		async function initializeEsbuild() {
			await esbuild.initialize({
				wasmURL: esbuildasmsrc,
			});
		}
		initializeEsbuild();
	}, []);

	useEffect(() => {
		if (rfInstance) {
			rfInstance.fitView();
		}
	}, [rfInstance]);
	const onNodeContextMenu = useCallback(
		(event, node) => {
			// Prevent native context menu from showing
			event.preventDefault();

			// Calculate position of the context menu. We want to make sure it
			// doesn't get positioned off-screen.
			const pane = ref.current.getBoundingClientRect();
			setMenu({
				id: node.id,
				top: event.clientY < pane.height - 200 && event.clientY,
				left: event.clientX < pane.width - 200 && event.clientX,
				right:
					event.clientX >= pane.width - 200 &&
					pane.width - event.clientX,
				bottom:
					event.clientY >= pane.height - 200 &&
					pane.height - event.clientY,
			});
		},
		[setMenu]
	);

	// Close the context menu if it's open whenever the window is clicked.
	const onPaneClick = useCallback(() => setMenu(null), [setMenu]);
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
		<>
			<ReactFlow
				ref={ref}
				onInit={setRfInstance}
				nodes={nodes}
				edges={edges}
				onDragOver={onDragOver}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				onDrop={onDrop}
				fitView
				onNodeDoubleClick={onNodeDoubleClick}
				multiSelectionKeyCode={"Control"}
				selectionKeyCode={"Control"}
				minZoom={0.2}
				onPaneClick={onPaneClick}
				onNodeContextMenu={onNodeContextMenu}
			>
				<Toolbar />
				<Background
					color="#1F1F1F"
					style={{ backgroundColor: "#111111" }}
					size={3}
					gap={30}
				/>
				<MiniMap
					style={{ backgroundColor: "black" }}
					position={"bottom-left"}
				/>
				<Controls position={"top-left"}>
					<ControlButton onClick={onRestore}>
						<FaFolderOpen />
					</ControlButton>
					<ControlButton onClick={onSave}>
						<FaSave />
					</ControlButton>

					<ControlButton onClick={onPlay}>
						<FaPlay />
					</ControlButton>
				</Controls>
				{menu && <ContextMenu onClick={onPaneClick} {...menu} />}

				{/* <Marker color="#1F1F1F" id="arrow" /> */}
			</ReactFlow>
		</>
	);
}

export default Flow;
