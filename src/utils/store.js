import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

import initialNodes from "../init/nodes";
import initialEdges from "../init/edges";

import { topologicalSort } from "./tsort";

import MyWorker from "./worker2?worker?inline";
import * as esbuild from "esbuild-wasm";



async function bundle(entry, modules) {
	try {
		const result = await esbuild.build({
			entryPoints: [entry],
			bundle: true,
			format: "iife",
			globalName: "A",
			footer: {
				js: "return A;",
			},

			plugins: [
				{
					name: "in-memory",
					setup(build) {
						build.onResolve({ filter: /.*/ }, (args) => {
							return {
								path: args.path,
								namespace: "in-memory",
							};
						});

						build.onLoad(
							{ filter: /.*/, namespace: "in-memory" },
							(args) => {
								return { contents: modules[args.path] };
							}
						);
					},
				},
			],
		});
		return new TextDecoder().decode(result.outputFiles[0].contents);
	} catch (e) {
		console.error(e);
	}
}

const useStore = create((set, get) => ({
	nodes: initialNodes,
	edges: initialEdges,
	selectedNodeId: "",
	selectedNode: {},
	...(async () => {
		await esbuild.initialize({
			wasmURL: "./node_modules/esbuild-wasm/esbuild.wasm",
		});
		const workers = {};
		const channels = {};
		for (const node of initialNodes) {
			const bundledCode = await bundle(node.id, initialNodes);
			const worker = new MyWorker();
			const channel = new MessageChannel();
			worker.postMessage(
				{
					type: "init",
					module: node.id,
					code: bundledCode,
				},
				[channel.port2],
				import.meta.url
			);
			channel.port1.onmessage = ({ data }) => {
				worker.postMessage({
					type: "update",
					module: node.id,
					code: data,
				});
			};

			workers[node.id] = worker;
			channels[node.id] = channel;
		}
		return { workers, channels };
	})(),
	// topo: topologicalSort(initialEdges),
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
