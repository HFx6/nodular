import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

import initialNodes from "../init/nodes";
import initialEdges from "../init/edges";

import { topologicalSort } from "./tsort";

const useStore = create((set, get) => ({
	nodes: initialNodes,
	edges: initialEdges,
	selectedNodeId: "",
	selectedNode: {},
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
