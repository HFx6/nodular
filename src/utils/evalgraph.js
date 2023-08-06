import { topologicalSort } from "./tsort";
import useStore from "../utils/store";
import ReactFlow, {
	getIncomers,
	getOutgoers,
	useUpdateNodeInternals,
} from "reactflow";

function depGraph(edges) {
	var dependencies = {};
	for (const edge of edges) {
		if (!dependencies[edge.source]) dependencies[edge.source] = [];
		if (!dependencies[edge.target]) dependencies[edge.target] = [];
	}
	for (const edge of edges) {
		dependencies[edge.target].push(edge.source);
	}
	return dependencies;
}

function evalNode(node, nodes, edges) {
	var nodeIns = getIncomers(node, nodes, edges);
	var nodeOuts = getOutgoers(node, nodes, edges);
}


// var evalgraph = (node, edges, nodes) => {
// 	// console.log("called on: ", node);
// 	try{
// 		var nodeIns = getIncomers(node, nodes, edges);
// 	}catch(err){
// 		return nodes;
// 	}

// 	var dependmet = node.data.args.length == nodeIns.length;
// 	if (dependmet) {
// 		var args = [];
// 		for (const _subnode of nodeIns) {
// 			// console.log(`got arg ${_subnode}`);
// 			try {
// 				// console.log();

// 				// args.push(_subnode.data.funceval ?? _subnode.data.func());
// 				args.push(_subnode.data.funceval ?? new Function("return function"+_subnode.data.func.replace("function", ""))()());
// 				// if (_subnode.data.args.length > 0) _subnode.data.funceval = null;
// 			} catch (err) {
// 				// console.log("upstream failure ", err);
// 				// console.log("subnode ", _subnode);
// 				break;
// 			}
// 		}
// 		// console.log("built args array: ", args);
// 		// console.log(String(node.data.func));

// 		// if (node.data.hasfunc) node.data.funceval = node.data.func(...args);
// 		try{
// 			if (node.data.hasfunc) node.data.funceval = new Function("return function"+node.data.func.replace("function", ""))()(...args);
// 		}
// 		catch(err){
// 			// console.log("bad function");
// 			return nodes;
// 		}
// 		var nodeOuts = getOutgoers(node, nodes, edges);
// 		for (const _subnode of nodeOuts) {
// 			// console.log(`propgating to`, _subnode);
// 			evalgraph(_subnode, edges, nodes);
// 		}
// 	}
// 	// var dependencies = depGraph(edges);
// 	// var topo = topologicalSort(edges);
// 	// console.log("nodeIns: ", nodeIns);
// 	// console.log("inputs met: ", dependmet);
// 	// console.log("dependencies: ",dependencies[node.id]);
// 	// console.log("topo: ",topo);

// 	return nodes;
// };

// function evalgraph(node, nodes, edges, updateLoadingCallback) {
// 	const nodeIns = getIncomers(node, nodes, edges);
// 	const dependmet = node.data.args.length === nodeIns.length;
// 	console.log(node.data.args, node, nodes, edges);
// 	if (dependmet) {
// 		try {
// 			const args = nodeIns.map((_subnode) => {
// 				console.log(_subnode.data.funceval);
// 				console.log(
// 					new Function(
// 						`return function ${_subnode.data.func.replace(
// 							"function",
// 							""
// 						)}`
// 					)()()
// 				);
// 				return (
// 					_subnode.data.funceval ??
// 					new Function(
// 						`return function ${_subnode.data.func.replace(
// 							"function",
// 							""
// 						)}`
// 					)()()
// 				);
// 			});

// 			if (node.data.hasfunc) {
// 				updateLoadingCallback(node.id, {loading: true});
// 				node.data.funceval = new Function(
// 					`return function ${node.data.func.replace("function", "")}`
// 				)()(...args);
// 				updateLoadingCallback(node.id, {loading: false});
// 			}

// 			const nodeOuts = getOutgoers(node, nodes, edges);
// 			for (const _subnode of nodeOuts) {
// 				evalgraph(_subnode, edges, nodes);
// 			}
// 		} catch (err) {
// 			console.error("Error during evaluation:", err);
// 		}
// 	}

// 	return nodes;
// }

function evalgraph(node, nodes, edges, updateLoadingCallback) {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const nodeIns = getIncomers(node, nodes, edges);
		const dependmet = node.data.args.length === nodeIns.length;

		if (!dependmet) {
			resolve(nodes);
			return;
		}

		try {
			const args = nodeIns.map((_subnode) => {
				return (
					_subnode.data.funceval ??
					new Function(
						`return function ${_subnode.data.func.replace(
							"function",
							""
						)}`
					)()()
				);
			});

			if (node.data.hasfunc) {
				// console.log(node.id);
				updateLoadingCallback(node.id, true);
				node.data.funceval = new Function(
					`return function ${node.data.func.replace("function", "")}`
				)()(...args);
				setTimeout(() => {
					updateLoadingCallback(node.id, false);
				}, 300);
        
			}
			
			const nodeOuts = getOutgoers(node, nodes, edges);
			const promises = nodeOuts.map((_subnode) =>
				evalgraph(_subnode, edges, nodes)
			);

			Promise.all(promises)
				.then(() => {
					const endTime = Date.now();
					const timeTaken = endTime - startTime;
					resolve({ nodes, timeTaken });
				})
				.catch((err) => {
					reject(err);
				});
		} catch (err) {
			console.error("Error during evaluation:", err);
			reject(err);
		}
	});
}

export { evalgraph };
