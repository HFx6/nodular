import { topologicalSort } from "./tsort";
import useStore from "../utils/store";
import { getIncomers } from "reactflow";
import { ato_run } from "./client/ato";
import { TIO } from "./client/tio";
import { rollup } from "@rollup/browser";
import { wasm } from "@rollup/plugin-wasm";
import fs from "fs";
import { ViaClass } from "./via";
import MyWorker from "./worker?worker&inline";

let worker = null;

const Constants = {};

async function evalNodeJavascript(args, node) {
	const output = new Function(
		`return function ${node.data.func.replace("function", "")}`
	)()(...args);
	console.log("Javascript Output:", output);
	return output;
}

async function evalNodePython(args, node) {
	console.log(args);
	// const output = 1;
	const output = await ato_run(node?.data?.func, args.join(", "));

	// const output = await TIO.run(`using System;
	// class Program {
	// 	static void Main(string[] args) {
	// 		Console.WriteLine("Hello, World!");
	// 	}
	// }`, "", "cs-csc");

	console.log("Python Output:", output);
	return output;
}

async function evalNode(args, node) {
	switch (node.type) {
		case "pythonNode":
			return await evalNodePython(args, node);
		default:
			return await evalNodeJavascript(args, node);
	}
}

async function graphTraversal(nodes, edges, current_node) {
	const nodeIns = getIncomers(current_node, nodes, edges);
	if (nodeIns.length == current_node.data.args.length) {
		try {
			const args = nodeIns.map((_subnode) => {
				console.log(_subnode);
				return _subnode.data.funceval;
			});

			if (current_node.data.hasfunc) {
				current_node.data.funceval = await evalNode(args, current_node);
			}
		} catch (err) {
			console.log(err);
		}
	}

	return current_node.data.funceval;
}

function rollupBundle(modulesOBJ) {
	rollup({
		input: "LoadNes.js",
		plugins: [
			wasm(),
			{
				name: "loader",
				resolveId(source) {
					// console.log(source);
					if (modulesOBJ.hasOwnProperty(source)) {
						return source;
					}
				},
				load(id) {
					if (modulesOBJ.hasOwnProperty(id)) {
						return modulesOBJ[id];
					}
				},
			},
		],
	})
		.then((bundle) =>
			bundle.generate({
				format: "es",
			})
		)
		.then(({ output }) => {
			// Rollup bundled code string.
			const code = output[0].code;
			console.log(code);
			if (worker) worker.terminate();
			const canvas = document.getElementById('node-canvas'); // Replace 'yourCanvasId' with your canvas element's ID
			const offscreenCanvas  = canvas.transferControlToOffscreen();
			worker = new MyWorker();

			// Hook up Via's messages with the worker's postMessage bridge
			worker.onmessage = (e) => ViaReceiver.OnMessage(e.data);
			ViaReceiver.postMessage = (data) => worker.postMessage(data);

			worker.addEventListener("message", (event) => {
				const msg = event.data;
				switch (msg.type) {
					case "wokerOperation":
						Constants[msg.data.name] = msg.data.value;
						console.log(Constants);
						break;
				}
			});

			worker.postMessage({ code, type: "start", offscreenCanvas }, [offscreenCanvas]);
		});
}

function evalGraph(startingNodeID) {
	const OBJM = {};
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		const { nodes, edges } = useStore.getState();
		const _topological_sort = topologicalSort(edges);
		const indexOfNode = _topological_sort.indexOf(startingNodeID);
		const topological_sort =
			indexOfNode == -1
				? _topological_sort
				: _topological_sort.slice(indexOfNode);

		(async () => {
			while (topological_sort.length > 0) {
				const current_node = nodes.find(
					(obj) => obj.id === topological_sort[0]
				);
				if (current_node)
					if (current_node.data.funcnode)
						OBJM[current_node?.data?.label] =
							current_node.data.func;
				// await graphTraversal(nodes, edges, current_node);
				topological_sort.shift();
			}
			// console.log(OBJM);
			rollupBundle(OBJM);

			const endTime = Date.now();
			const timeTaken = endTime - startTime;
			resolve({ nodes, timeTaken });
		})();
	});
}

export { evalGraph };
