import { topologicalSort } from "./tsort";
var evalgraph = (edges, nodes) => {
	// Create an object to store the dependencies
	const dependencies = {};

	// Initialize the dependencies object with an empty array for each node
	for (const edge of edges) {
		if (!dependencies[edge.source]) dependencies[edge.source] = [];
		if (!dependencies[edge.target]) dependencies[edge.target] = [];
	}

	// Fill in the dependencies object
	for (const edge of edges) {
		dependencies[edge.target].push(edge.source);
	}

	for (const element in dependencies) {
        
	}
	console.log(dependencies);
};

export { evalgraph };
