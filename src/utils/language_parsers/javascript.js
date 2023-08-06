import { parser } from "@lezer/javascript";

const functionArgs = (code) => {
    const tree = parser.parse(code);
    const cursor = tree.cursor();
    let result = {
        functionName: null,
        args: []
    };

    while (cursor.next()) {
        if (cursor.node.type.name === "FunctionDeclaration") {
            cursor.firstChild(); // move to function keyword
            cursor.nextSibling(); // move to function name
            result.functionName = code.slice(cursor.from, cursor.to);
            cursor.nextSibling(); // move to parameter list

            // Traverse the parameter list to extract argument names
            cursor.firstChild(); // move to first parameter
            do {
                if (cursor.node.type.name === "VariableDefinition") {
                    const start = cursor.from;
                    const end = cursor.to;
                    result.args.push(code.slice(start, end));
                }
            } while (cursor.nextSibling());
            break;
        }
    }
    return result;
};


export { functionArgs };
