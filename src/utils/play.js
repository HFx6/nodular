import { evalGraph } from "./evalgraph";
export const onPlay = async (e, startingNodeID = null) => {
	e.preventDefault();
	try {
		const result = await evalGraph(startingNodeID);
		console.log("Time taken:", result.timeTaken, "ms");
	} catch (err) {
		console.error("Error during evaluation:", err);
	}
};
