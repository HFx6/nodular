import { topologicalSort } from "./tsort";
import useStore from "./store";
import { getIncomers } from "reactflow";
import * as esbuild from "esbuild-wasm";
import { MarkerType } from "reactflow";

import MyWorker from "./workers/worker?worker&inline";

import { ViaClass } from "./via";

let worker = null;

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

function idToNode(id, nodes) {
	return nodes.find((obj) => obj.id === id);
}

async function evalGraph(startingNodeID) {
	const startTime = Date.now();
	const { nodes, edges, updateNode, setEdges } = useStore.getState();
	const topologicalSortResult = topologicalSort(edges);
	let rootExport = "";
	// let rootExport = `import '${
	// 	topologicalSortResult[topologicalSortResult.length - 1]
	// }';\n`;
	const rootExportIds = [];
	const moduleObj = {};
	const canvasObj = {};
	// console.log(topologicalSortResult);
	const importLocations = {};
	const endNodes = [];

	for (const edge of edges) {
		const sourceNode = idToNode(edge.source, nodes);
		const targetNode = idToNode(edge.target, nodes);
		const sourceLabel = edge.sourceHandle;
		const targetLabel = edge.targetHandle;

		if (
			targetNode.data.returnArgs.length == 0 &&
			!endNodes.includes(targetNode.id)
		) {
			if (targetNode.type == "Bool") {
				rootExport += `import { ${targetNode.id} } from '${targetNode.id}';\n`;
				rootExportIds.push(targetNode.id);
			} else {
				rootExport += `import '${targetNode.id}';\n`;
			}
			endNodes.push(targetNode.id);
		}
		// const incomers = getIncomers(targetNode, nodes, edges);
		// let imports = "";
		// let edgeargtoreturn = '';
		// for (let i = 0; i < incomers.length; i++) {
		if (sourceNode.type == "Canvas") {
			console.log("sourceNode node", sourceNode);
			console.log("targetNode node", targetNode);
			canvasObj[sourceNode.id] = document
				.getElementById(sourceNode.id)
				.transferControlToOffscreen();

			if (importLocations[targetNode.id]) {
				importLocations[targetNode.id].push(
					`const ${sourceLabel} = canvasObj["${sourceNode.id}"];\n`
				);
			} else {
				importLocations[targetNode.id] = [
					`const ${sourceLabel} = canvasObj["${sourceNode.id}"];\n`,
				];
			}
			continue;
		}
		if (importLocations[targetNode.id]) {
			importLocations[targetNode.id].push(
				`import { ${sourceLabel} as ${targetLabel} } from '${sourceNode.id}';\n`
			);
		} else {
			importLocations[targetNode.id] = [
				`import { ${sourceLabel} as ${targetLabel} } from '${sourceNode.id}';\n`,
			];
		}
		// importLocations[targetLabel.id] = `import { ${incomers[i].data.returnArgs} as ${currentNode.data.args[i]} } from '${incomers[i].id}';\n`;
		// }

		moduleObj[sourceNode.id] = sourceNode.data.func;
		moduleObj[targetNode.id] = targetNode.data.func;
		// topologicalSortResult.shift();
	}

	for (const key in importLocations) {
		moduleObj[key] = importLocations[key].join("") + moduleObj[key];
	}
	if (rootExportIds.length > 0)
		rootExport += `module.exports = { ${rootExportIds.join(",")} }`;
	// console.log(moduleObj);
	moduleObj["rootExport"] = rootExport;

	const bundledCode = await bundle(
		rootExportIds.length
			? "rootExport"
			: topologicalSortResult[topologicalSortResult.length - 1],
		moduleObj
	);
	if (worker) worker.terminate();
	worker = new MyWorker();
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
	worker.postMessage(
		{ code: bundledCode, canvasObj: canvasObj, type: "start" },
		Object.values(canvasObj)
	);
	// const moduleExports = new Function(
	// 	`const canvas = document.getElementById("node-canvas");\n\n` +
	// 		bundledCode
	// )();

	// if (moduleExports) {
	// 	const updateNodeIDs = Object.keys(moduleExports);
	// 	for (let i = 0; i < updateNodeIDs.length; i++) {
	// 		updateNode(updateNodeIDs[i], {
	// 			funceval: moduleExports[updateNodeIDs[i]],
	// 		});
	// 	}
	// }

	const endTime = Date.now();
	const timeTaken = endTime - startTime;
	return { topologicalSortResult, timeTaken };
}

export { evalGraph };
