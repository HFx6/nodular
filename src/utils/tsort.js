function topologicalSort(edges) {
	// Create a map to store the graph
	const graph = new Map();
	// Create a set to store visited nodes
	const visited = new Set();
	// Create a set to store nodes currently being visited
	const visiting = new Set();
	// Create a stack to store the sorted nodes
	const stack = [];

	// Build the graph from the edge list
	for (const edge of edges) {
		if (!graph.has(edge.source)) graph.set(edge.source, []);
		if (!graph.has(edge.target)) graph.set(edge.target, []);
		graph.get(edge.source).push(edge.target);
	}

	// Perform a modified depth-first search
	for (const [node, edges] of graph) {
		if (!visited.has(node)) {
			if (!dfs(node)) {
				return new Error("The graph has a loop");
			}
		}
	}

	// Return the sorted nodes
	return stack;

	// Depth-first search function
	function dfs(node) {
		visiting.add(node);
		for (const neighbor of graph.get(node) || []) {
			if (visiting.has(neighbor)) {
				return false;
			}
			if (!visited.has(neighbor)) {
				if (!dfs(neighbor)) {
					return false;
				}
			}
		}
		visiting.delete(node);
		visited.add(node);
		stack.unshift(node);
		return true;
	}
}

export { topologicalSort };
