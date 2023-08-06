import { parser } from "@lezer/python";

const functionArgs = (code) => {
    const tree = parser.parse(code);
    const cursor = tree.cursor();
    let args = [];
    
    while (cursor.next()) {
        console.log(cursor.node.type);
        if (cursor.node.type.name === "FunctionDefinition") {
            cursor.firstChild(); // move to function keyword
            cursor.nextSibling(); // move to function name
            cursor.nextSibling(); // move to parameter list

            // Traverse the parameter list to extract argument names
            cursor.firstChild(); // move to first parameter
            do {
                if (cursor.node.type.name === "VariableName") {
                    const start = cursor.from;
                    const end = cursor.to;
                    args.push(code.slice(start, end));
                }
            } while (cursor.nextSibling());
            break;
        }
    }
    return args;
};

export { functionArgs }