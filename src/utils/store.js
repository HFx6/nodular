import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

import initialNodes from "../init/nodes";
import initialEdges from "../init/edges";

import { topologicalSort } from "./tsort";
import { evalgraph } from "./evalgraph";
import { evalnode } from "./evalnode";

// const { x = 0, y = 0, zoom = 1 } = flow.viewport;
// 				console.log();
// 				setNodes(flow.nodes || []);
// 				setEdges(flow.edges || []);
// 				setViewport({ x, y, zoom });

// const localGraph = JSON.parse(localStorage.getItem("example-flow"));;

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create((set, get) => ({
	nodes: initialNodes,
	edges: initialEdges,
	topo: topologicalSort(initialEdges),
	onNodesChange: (changes) => {
		set({
			nodes: applyNodeChanges(changes, get().nodes),
		});
	},
	onEdgesChange: (changes) => {
		set({
			edges: applyEdgeChanges(changes, get().edges),
		});
	},
	onConnect: (connection) => {
		set({
			edges: addEdge(connection, get().edges),
		});
		set({
			topo: topologicalSort(get().edges),
		});
		get().nodes.map((node) => {
			if (node.id === connection.target) {
				set({
					nodes: evalgraph(node, get().edges, get().nodes),
				});
			}
		});
		// console.log(get().nodes);
	},
	updateInputValue: (nodeId, value) => {
		console.log("update ", value);
		set({
			nodes: get().nodes.map((node) => {
				if (node.id === nodeId) {
					// it's important to create a new object here, to inform React Flow about the cahnges
					node.data = { ...node.data, funceval: value };
					if(node.data.funceval) set({
						nodes: evalgraph(node, get().edges, get().nodes),
					});
				}

				return node;
			}),
		});
	},
	updateEditorContent: (nodeId, value) => {
		set({
			nodes: get().nodes.map((node) => {
				if (node.id === nodeId) {
					// it's important to create a new object here, to inform React Flow about the cahnges
					node.data = { ...node.data, ...value };
					set({
						nodes: evalgraph(node, get().edges, get().nodes),
					});
				}

				return node;
			}),
		});
	},
	setNodes: (nodes) => {
		set({
			nodes: nodes,
		});
	},
	setEdges: (edges) => {
		set({
			edges: edges,
		});
	},
}));

export default useStore;
