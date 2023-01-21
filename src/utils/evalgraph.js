import { topologicalSort } from "./tsort";
import ReactFlow, { getIncomers, getOutgoers } from "reactflow";

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

var evalgraph = (node, edges, nodes) => {
	console.log("called on: ", node);
	var nodeIns = getIncomers(node, nodes, edges);
	var dependmet = node.data.args.length == nodeIns.length;
	if (dependmet) {
		var args = [];
		for (const _subnode of nodeIns) {
			// console.log(`got arg ${_subnode}`);
			try {
				console.log();
				args.push(_subnode.data.funceval ?? _subnode.data.func());
				// if (_subnode.data.args.length > 0) _subnode.data.funceval = null;
			} catch (err) {
				console.log("upstream failure ", err);
				console.log("subnode ", _subnode);
				break;
			}
		}
		console.log("built args array: ", args);
		console.log(String(node.data.func));
		if (node.data.hasfunc) node.data.funceval = node.data.func(...args);
		var nodeOuts = getOutgoers(node, nodes, edges);
		for (const _subnode of nodeOuts) {
			console.log(`propgating to`, _subnode);
			evalgraph(_subnode, edges, nodes);
		}
	}
	// var dependencies = depGraph(edges);
	// var topo = topologicalSort(edges);
	// console.log("nodeIns: ", nodeIns);
	// console.log("inputs met: ", dependmet);
	// console.log("dependencies: ",dependencies[node.id]);
	// console.log("topo: ",topo);

	return nodes;
};

export { evalgraph };
