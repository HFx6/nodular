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
	// postMessage({ type: "wokerOperation", data: { name: "my_val", value: 2 } });
	const exvalue = fn(document, fetchRaw, canvasObj); // Execute the function// const moduleExports = new Function(
	console.log(exvalue);
}
