// foo.js

import { text, array } from "~node-targets";
// import { text } from "stringSource.js";
// import {  array } from "arraySource.js";

function foo(text, array) {
	return array.includes(text);
}
console.log(foo());

// stringSource.js
const text = "hello";
export { text };

// arraySource.js
const array = ["hello", "world"];
export { array };

// reactflow node edges
const edges = [
	{
		source: "stringSource",
		sourceHandle: null,
		target: "foo",
		targetHandle: "shift",
	},
	{
		source: "arraySource",
		sourceHandle: null,
		target: "foo",
		targetHandle: "shift",
	},
];

const nodes = [
	{
		// react flow node data here
		data: {
			label: "arraySource",
			funcString: `const array = ["hello", "world"];`,
		},
	},
	//... other nodes
];

// gets all the connected nodes to it giving inputs
const importedModules = getIncomers("foo");
// importedModules == [
//  {
// react flow node data here
// 	data: {
// 		label: "arraySource",
// 		funcString: `const array = ["hello", "world"];`,
// 	},
// },
//... other nodes
// ]
