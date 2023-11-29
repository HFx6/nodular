import { topologicalSort } from "./tsort";
import useStore from "./store";
import { getIncomers } from "reactflow";
import * as esbuild from "esbuild-wasm";

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

function getObjectBySourceAndTarget(array, sourceId, targetId) {
	return array.filter(
		(item) => item.source === sourceId && item.target === targetId
	);
}

async function evalGraph(startingNodeID) {
	const OBJM = {};
	const startTime = Date.now();
	const { nodes, edges } = useStore.getState();
	const _topological_sort = topologicalSort(edges);
	const topological_sort = [..._topological_sort];
	const entry_node = topological_sort[topological_sort.length - 1];

	while (topological_sort.length > 0) {
		const current_node = nodes.find(
			(obj) => obj.id === topological_sort[0]
		);
		const incomers = getIncomers(current_node, nodes, edges);
		let s = "";

		for (let i = 0; i < incomers.length; i++) {
			let sourceId = incomers[i].id;
			let targetId = current_node.id;
			let result = getObjectBySourceAndTarget(edges, sourceId, targetId);
			s += `import { ${incomers[i].data.returnArgs} as ${current_node.data.args[i]} } from '${incomers[i].id}';\n`;
		}

		OBJM[current_node.id] = s + current_node.data.func;
		console.log(OBJM[current_node.id]);
		topological_sort.shift();
	}

	const bundledCode = await bundle(entry_node, OBJM);
	const A = new Function(bundledCode)();

	console.log(A);

	const endTime = Date.now();
	const timeTaken = endTime - startTime;
	return { _topological_sort, timeTaken };
}

export { evalGraph };
