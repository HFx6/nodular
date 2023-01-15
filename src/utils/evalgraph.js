import { topologicalSort } from "./tsort";
import ReactFlow, { getIncomers  } from 'reactflow';


function depGraph(edges){
	var dependencies = {}
	for (const edge of edges) {
		if (!dependencies[edge.source]) dependencies[edge.source] = [];
		if (!dependencies[edge.target]) dependencies[edge.target] = [];
	}
	for (const edge of edges) {
		dependencies[edge.target].push(edge.source);
	}
	return dependencies;
}


var evalgraph = (node, edges, nodes) => {

	var nodeIns = getIncomers(node, nodes, edges);
	var dependencies = depGraph(edges);	
	var topo = topologicalSort(edges);
	console.log("nodeIns: ",nodeIns);
	console.log("dependencies: ",dependencies[node.id]);
	console.log("topo: ",topo);

	function evalDeps(){
		var _deps = [];
	}

	function traverse(_node){
		var _nodein = getIncomers(_node, nodes, edges);
		console.log("nodein for: ",_node.data.label,_nodein);
        if(_nodein.length==0 || _node.data?.args?.length==0){
			if(_node.data.funceval==null) _node.data.funceval = _node.data.func();
		} else {
			var args = [];
			for(const _subnode of _nodein){
				if(_subnode.data.funceval==null) return nodes;
				args.push(_subnode.data.funceval);
			}
			console.log("args :", args);
			console.log("cureent node :", _node.data.label);
			if(args.length==_node.data?.args.length) _node.data.funceval = _node.data.func(...args);
		}
		console.log("nodes: ", nodes);
	}

	traverse(node);

	for (const innodes of nodeIns) {
		traverse(innodes)
	}
	
	return nodes;

};

export { evalgraph };
