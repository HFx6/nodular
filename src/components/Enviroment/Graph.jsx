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
import { shallow } from "zustand/shallow";

import { onPlay } from "../../utils/play";

import useStore from "../../utils/store";

import { FaPlay } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import { FaFolderOpen } from "react-icons/fa";

import * as esbuild from "esbuild-wasm";
import { MarkerType } from "reactflow";




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

import ContextMenu from "../Nodes/Base/ContextMenu";

const nodeTypes = { Array, Bool, Function, Input };

const flowKey = "nodular_schema";

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
				wasmURL: "./node_modules/esbuild-wasm/esbuild.wasm",
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

	return (
		<>
			<svg style={{ position: "absolute", top: 0, left: 0 }}>
				<defs>
					<marker
						id="logo"
						viewBox="0 0 40 40"
						markerHeight={20}
						markerWidth={20}
						refX={20}
						refY={40}
					>
						<path
							d="M35 23H25C23.8954 23 23 23.8954 23 25V35C23 36.1046 23.8954 37 25 37H35C36.1046 37 37 36.1046 37 35V25C37 23.8954 36.1046 23 35 23Z"
							stroke="#1A192B"
							stroke-width="2"
							fill="white"
						/>
						<path
							d="M35 3H25C23.8954 3 23 3.89543 23 5V15C23 16.1046 23.8954 17 25 17H35C36.1046 17 37 16.1046 37 15V5C37 3.89543 36.1046 3 35 3Z"
							stroke="#FF0072"
							stroke-width="2"
							fill="white"
						/>
						<path
							d="M15 23H5C3.89543 23 3 23.8954 3 25V35C3 36.1046 3.89543 37 5 37H15C16.1046 37 17 36.1046 17 35V25C17 23.8954 16.1046 23 15 23Z"
							stroke="#1A192B"
							stroke-width="2"
							fill="white"
						/>
						<path
							d="M15 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3Z"
							stroke="#1A192B"
							stroke-width="2"
							fill="white"
						/>
						<path
							d="M17 13C18.6569 13 20 11.6569 20 10C20 8.34315 18.6569 7 17 7C15.3431 7 14 8.34315 14 10C14 11.6569 15.3431 13 17 13Z"
							fill="white"
						/>
						<path
							d="M23 13C24.6569 13 26 11.6569 26 10C26 8.34315 24.6569 7 23 7C21.3431 7 20 8.34315 20 10C20 11.6569 21.3431 13 23 13Z"
							fill="white"
						/>
						<path
							d="M30 20C31.6569 20 33 18.6569 33 17C33 15.3431 31.6569 14 30 14C28.3431 14 27 15.3431 27 17C27 18.6569 28.3431 20 30 20Z"
							fill="white"
						/>
						<path
							d="M30 26C31.6569 26 33 24.6569 33 23C33 21.3431 31.6569 20 30 20C28.3431 20 27 21.3431 27 23C27 24.6569 28.3431 26 30 26Z"
							fill="white"
						/>
						<path
							d="M17 33C18.6569 33 20 31.6569 20 30C20 28.3431 18.6569 27 17 27C15.3431 27 14 28.3431 14 30C14 31.6569 15.3431 33 17 33Z"
							fill="white"
						/>
						<path
							d="M23 33C24.6569 33 26 31.6569 26 30C26 28.3431 24.6569 27 23 27C21.3431 27 20 28.3431 20 30C20 31.6569 21.3431 33 23 33Z"
							fill="white"
						/>
						<path
							d="M30 25C31.1046 25 32 24.1046 32 23C32 21.8954 31.1046 21 30 21C28.8954 21 28 21.8954 28 23C28 24.1046 28.8954 25 30 25Z"
							fill="#1A192B"
						/>
						<path
							d="M17 32C18.1046 32 19 31.1046 19 30C19 28.8954 18.1046 28 17 28C15.8954 28 15 28.8954 15 30C15 31.1046 15.8954 32 17 32Z"
							fill="#1A192B"
						/>
						<path
							d="M23 32C24.1046 32 25 31.1046 25 30C25 28.8954 24.1046 28 23 28C21.8954 28 21 28.8954 21 30C21 31.1046 21.8954 32 23 32Z"
							fill="#1A192B"
						/>
						<path
							opacity="0.35"
							d="M22 9.5H18V10.5H22V9.5Z"
							fill="#1A192B"
						/>
						<path
							opacity="0.35"
							d="M29.5 17.5V21.5H30.5V17.5H29.5Z"
							fill="#1A192B"
						/>
						<path
							opacity="0.35"
							d="M22 29.5H18V30.5H22V29.5Z"
							fill="#1A192B"
						/>
						<path
							d="M17 12C18.1046 12 19 11.1046 19 10C19 8.89543 18.1046 8 17 8C15.8954 8 15 8.89543 15 10C15 11.1046 15.8954 12 17 12Z"
							fill="#1A192B"
						/>
						<path
							d="M23 12C24.1046 12 25 11.1046 25 10C25 8.89543 24.1046 8 23 8C21.8954 8 21 8.89543 21 10C21 11.1046 21.8954 12 23 12Z"
							fill="#FF0072"
						/>
						<path
							d="M30 19C31.1046 19 32 18.1046 32 17C32 15.8954 31.1046 15 30 15C28.8954 15 28 15.8954 28 17C28 18.1046 28.8954 19 30 19Z"
							fill="#FF0072"
						/>
					</marker>
				</defs>
			</svg>
			<ReactFlow
				ref={ref}
				onInit={setRfInstance}
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				fitView
				onNodeDoubleClick={onNodeDoubleClick}
				multiSelectionKeyCode={"Control"}
				selectionKeyCode={"Control"}
				minZoom={0.2}
				onPaneClick={onPaneClick}
				onNodeContextMenu={onNodeContextMenu}
			>
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
