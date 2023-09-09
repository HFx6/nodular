"use strict";

//first line before voby initialization
import { ViaClass } from "./via";
// fix import of react
import { fetchRaw } from "./fetchHandle.js";

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
		Start(e.data.code);
	} else {
		Via.onMessage(e.data);
	}
});

async function Start(code) {
	const document = via.document;
	fetchRaw("src/utils/roms/INVADERS?raw-hex");
	const fn = new Function("document", "fetch", code); // Create a function from the generated code
	fn(document, fetchRaw); // Execute the function
}
