"use strict";

//first line before voby initialization
import { ViaClass } from "../via";
// fix import of react
import { fetchRaw } from "../fetchHandle.js";
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
		const { code, canvasObj } = e.data;
		Start(code, canvasObj);
	}  else {
		Via.onMessage(e.data);
	}
});

async function Start(code, canvasObj) {
	const document = via.document;
	const fn = new Function("document", "fetch", "canvasObj", code); // Create a function from the generated code
	
	const exvalue = fn(document, fetchRaw, canvasObj); // Execute the function// const moduleExports = new Function(
	// loop through the exports and turn any functions into a boolean
	for (const key in exvalue) {
		if (typeof exvalue[key] === "function") {
			exvalue[key] = true;
		}
	}
	postMessage({ type: "wokerOperation", data: exvalue });
	console.log(exvalue);
}
