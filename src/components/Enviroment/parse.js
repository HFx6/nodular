import { parser } from "@lezer/javascript";

const extractExports = (code) => {
	const tree = parser.parse(code);
	const cursor = tree.cursor();
	let result = [];

	while (cursor.next()) {
		if (cursor.node.type.name === "AssignmentExpression") {
			cursor.firstChild(); // move to module.exports
			cursor.nextSibling(); // move to equals sign
			cursor.nextSibling(); // move to the object expression
			if (cursor.node.type.name === "ObjectExpression") {
				cursor.firstChild(); // enter the object expression
				do {
					if (cursor.node.type.name === "Property") {
						cursor.firstChild(); // move to key
						const start = cursor.from;
						const end = cursor.to;
						result.push(code.slice(start, end));
						cursor.parent(); // move back to the property
					}
				} while (cursor.nextSibling());
			}
			break;
		}
	}
	return result;
};

export { extractExports };
