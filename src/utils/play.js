import { evalGraph } from "./evaluate_graph";
import toast from "react-hot-toast";
export const onPlay = async (e, startingNodeID = null) => {
	e.preventDefault();
	try {
		
		const result = await evalGraph(startingNodeID);
		console.log("Time taken:", result.timeTaken, "ms");
		toast.success("Time taken: " + result.timeTaken + "ms");
		console.log("topo:", result._topological_sort);
	} catch (err) {
		console.error("Error during evaluation:", err);
	}
};
