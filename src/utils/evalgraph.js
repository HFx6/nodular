import { topologicalSort } from "./tsort";
import useStore from "../utils/store";
import { getIncomers } from "reactflow";
import { ato_run } from "./client/ato";
import { TIO } from "./client/tio";

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

function evalGraph(startingNodeID) {
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
				await graphTraversal(nodes, edges, current_node);
				topological_sort.shift();
			}

			const endTime = Date.now();
			const timeTaken = endTime - startTime;
			resolve({ nodes, timeTaken });
		})();
	});
}

export { evalGraph };
