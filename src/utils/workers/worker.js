"use strict";

//first line before voby initialization
import { ViaClass } from "./via";
// fix import of react
import { fetchRaw } from "./fetchHandle.js";
// import { AudioContextRaw } from "./audioHandle";

const Via = self.Via;
const via = self.via;
const get = self.get;

self.addEventListener("message", (e) => {
	if (e.data.type === "start") {
		console.log("start");
		Via.postMessage = (data) => {
			try {
				self.postMessage(data);
			} catch (error) {
				console.error(error);
			}
		};
		const { code, offscreenCanvas } = e.data;
    const canvas = offscreenCanvas;
		Start(code, canvas);
	} else {
		Via.onMessage(e.data);
	}
});

async function Start(code, canvas) {
	const document = via.document;
	const fn = new Function("document", "fetch", "canvas", code); // Create a function from the generated code
	// postMessage({ type: "wokerOperation", data: { name: "my_val", value: 2 } });
	fn(document, fetchRaw, canvas); // Execute the function
}
