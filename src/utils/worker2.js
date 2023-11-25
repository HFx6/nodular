"use strict";

import { parser } from "@lezer/javascript";

const functionArgs = (code) => {
	const tree = parser.parse(code);
	const cursor = tree.cursor();
	let imports = {};

	while (cursor.next()) {
		if (cursor.node.type.name === "ImportDeclaration") {
			let source = "";
			// let importedVars = [];

			cursor.firstChild(); // move to first child of ImportDeclaration
			cursor.nextSibling();
			source = code.slice(cursor.from, cursor.to);
			cursor.nextSibling();
			cursor.nextSibling();
			imports[
				code
					.slice(cursor.from, cursor.to)
					.replace("'", "")
					.replace("'", "")
			] = [source];
		}
	}

	return imports;
};

let code;
let name;

onmessage = async (evt) => {
	if (evt.data.type === "init") {
		console.log("init " + evt.data.module);
		code = evt.data.code;
		name = evt.data.module;
		// const exports = new Function(code);
		console.log(code);
	} else if (evt.data.type === "update") {
		console.log("update " + evt.data.module);
		code = evt.data.code;
		// const exports = new Function(code);
		console.log(code);
	}
};
