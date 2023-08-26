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
import NFunction from "../nodes/function";
import NBool from "../nodes/bool";
import NInput from "../nodes/input";
import NArray from "../nodes/array";
import JavascriptNode from "../nodes/language_nodes/JavascriptNode";
import LuaNode from "../nodes/language_nodes/LuaNode";
import CanvasNode from "../nodes/language_nodes/CanvasNode";
import PythonNode from "../nodes/language_nodes/PythonNode";

import { shallow } from "zustand/shallow";
import nodeDefaults from "../init/nodedefaults";

import useStore from "../utils/store";
import { evalgraph } from "../utils/evalgraph";


import "reactflow/dist/style.css";

const flowKey = "nodular_schema";

const nodeTypes = {
	nodeFunction: NFunction,
	nodeBool: NBool,
	nodeInput: NInput,
	nodeArray: NArray,
	luaNode: LuaNode,
	pythonNode: PythonNode,
	canvasNode: CanvasNode,
};

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

function SaveRestore() {
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
  const reactFlowInstance = useReactFlow();

	// const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	// const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	// const [rfInstance, setRfInstance] = useState(null);
	const reactFlowWrapper = useRef(null);
	const [currentNode, setCurrentNode] = useState({});
	const [playing, setPlaying] = useState(false);
	const { setViewport } = useReactFlow();
	// const onConnectStart = (_, { nodeId, handleType }) =>
	// 	console.log("on connect start", { nodeId, handleType });
	// const onConnectEnd = (event) => console.log("on connect end", event);
	const onSave = useCallback(() => {
		if (reactFlowInstance) {
			const flow = toObject();
			localStorage.setItem(flowKey, JSON.stringify(flow));
			// console.log(JSON.stringify(flow));
		}
	}, [reactFlowInstance]);

	const updateLoadingCallback = 
		(id, loading) => {
			updateLoading(id, loading);
		};


	const onPlay = async () => {
		setPlaying(true);
		try {
			const result = await evalgraph(topo, getNodes(), getEdges(), getNode, updateLoadingCallback);
			console.log("Time taken:", result.timeTaken, "ms");
		} catch (err) {
			console.error("Error during evaluation:", err);
		}
		setPlaying(false);
	};

	const onNodeDoubleClick = useCallback((event, node) => {
		// Get the target element of the event
		const targetElement = event.target;

		// Check if the double click happened on an element or any of its parents with the class "ignore-double-click"
		const ignoreDoubleClick =
			targetElement.closest(".ignore-double-click") !== null;

		if (!ignoreDoubleClick) {
			setSelectedNode(node.id);
			if (node.data.funcedit) {
				setCurrentNode(node);
			} else {
				setCurrentNode({});
			}
		}
	}, []);

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

			const position = reactFlowInstance.project({
				x: event.clientX,
				y: event.clientY,
			});
			console.log(nodes);
			const newNode = {
				id: getId(),
				type,
				position,
				data: nodeDefaults[type].data,
			};

			setNodes([...nodes, newNode]);
			// setNodes((nds) => nds.concat(newNode));
		},
		[nodes]
	);

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			// onInit={setRfInstance}
			// onConnectStart={onConnectStart}
			// onConnectEnd={onConnectEnd}
			nodeTypes={nodeTypes}
			onNodeDoubleClick={onNodeDoubleClick}
			multiSelectionKeyCode={"Control"}
			selectionKeyCode={"Control"}
			onDrop={onDrop}
			onDragOver={onDragOver}
		>
			<Background
				color="#1F1F1F"
				style={{ backgroundColor: "#111111" }}
				size={3}
				gap={30}
			/>

			{/* <Toolbar /> */}
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
					<PiPlayFill style={{color: "#A0D468"}} />
				</ControlButton>
			</Controls>
		</ReactFlow>
	);
}

export default SaveRestore;
