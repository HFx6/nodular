// import { topologicalSort } from "./tsort";
var evalnode = (edges, nodes, node) => {
    var finalval = null;
    finalval = node.data.func.func();
	return {funcval: finalval}
};

export { evalnode };
