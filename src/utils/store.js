import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

import initialNodes from "./init/nodes";
import initialEdges from "./init/edges";

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create((set, get) => ({
	nodes: [],
	edges: [],
	selectedNodeId: "",
	selectedNode: {},
	workers: {},
	channels: {},
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
	},
	updateNode(id, data) {
		set({
			nodes: get().nodes.map((node) =>
				node.id === id
					? { ...node, data: Object.assign(node.data, data) }
					: node
			),
		});
	},
	setSelectedNode: (nodeId) => {
		set({
			selectedNodeId: nodeId,
		});
		get().nodes.map((node) => {
			if (node.id === nodeId) {
				set({
					selectedNode: node,
				});
			}
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
