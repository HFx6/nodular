import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

import initialNodes from "../init/nodes";
import initialEdges from "../init/edges";

import { topologicalSort } from './tsort';
import { evalgraph } from './evalgraph';
import { evalnode } from './evalnode';
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
		})
		console.log(get().nodes);
		
	},
	updateInputValue: (nodeId, value) => {
		set({
			nodes: get().nodes.map((node) => {
				if (node.id === nodeId) {
					// it's important to create a new object here, to inform React Flow about the cahnges
					node.data = { ...node.data, funceval: value };
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
					node.data = { ...node.data, ...value};
					console.log("try new eval: ",evalgraph(node, get().edges, get().nodes));
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
