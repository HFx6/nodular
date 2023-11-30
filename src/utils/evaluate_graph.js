import { topologicalSort } from "./tsort";
import useStore from "./store";
import { getIncomers } from "reactflow";
import * as esbuild from "esbuild-wasm";
import { MarkerType } from "reactflow";

await esbuild.initialize({
	wasmURL: "./node_modules/esbuild-wasm/esbuild.wasm",
});

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

async function evalGraph(startingNodeID) {
	const startTime = Date.now();
	const { nodes, edges, updateNode, setEdges } = useStore.getState();
	const topologicalSortResult = topologicalSort(edges);
	let rootExport = "";
	const rootExportIds = [];
	const moduleObj = {};

	while (topologicalSortResult.length > 0) {
		const currentNode = nodes.find(
			(obj) => obj.id === topologicalSortResult[0]
		);
		if (!currentNode.data.returnArgs) {
			rootExport += `import { ${currentNode.id} } from '${currentNode.id}';\n`;
			rootExportIds.push(currentNode.id);
		}
		const incomers = getIncomers(currentNode, nodes, edges);
		let imports = "";

		for (let i = 0; i < incomers.length; i++) {
			imports += `import { ${incomers[i].data.returnArgs} as ${currentNode.data.args[i]} } from '${incomers[i].id}';\n`;
		}

		moduleObj[currentNode.id] = imports + currentNode.data.func;
		topologicalSortResult.shift();
	}
	rootExport += `module.exports = { ${rootExportIds.join(",")} }`;
	moduleObj["rootExport"] = rootExport;
	const bundledCode = await bundle("rootExport", moduleObj);
	const moduleExports = new Function(bundledCode)();

	const updateNodeIDs = Object.keys(moduleExports);
	for (let i = 0; i < updateNodeIDs.length; i++) {
		updateNode(updateNodeIDs[i], {
			funceval: moduleExports[updateNodeIDs[i]],
		});
	}

	const endTime = Date.now();
	const timeTaken = endTime - startTime;
	return { topologicalSortResult, timeTaken };
}

export { evalGraph };
