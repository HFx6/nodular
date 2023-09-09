import { parser } from "@lezer/javascript";

const functionArgs = (code) => {
    const tree = parser.parse(code);
    const cursor = tree.cursor();
    let result = {
        functionName: null,
        args: []
    };

    while (cursor.next()) {
        if (cursor.node.type.name === "ExportDeclaration") {
            console.log(cursor.node);
            cursor.firstChild(); // move to function keyword
            cursor.nextSibling(); // move to function name
            if (cursor.node.type.name === "ExportGroup") {
                console.log(code.slice(cursor.from, cursor.to));
                result.args.push(...Object.keys(JSON.parse(code.slice(cursor.from, cursor.to))));
            }else{
                cursor.firstChild();
            cursor.nextSibling();
                result.args.push(code.slice(cursor.from, cursor.to));
            }
            
            console.log(cursor.node);
            // result.functionName = code.slice(cursor.from, cursor.to);
            // cursor.nextSibling(); // move to parameter list
            
            
            // Traverse the parameter list to extract argument names
            // cursor.firstChild(); // move to first parameter
            // do {
            //     if (cursor.node.type.name === "VariableDefinition") {
            //         const start = cursor.from;
            //         const end = cursor.to;
            //         result.args.push(code.slice(start, end));
            //     }
            // } 
            // while (cursor.nextSibling());
            // break;
        }
    }
    return result;
};


export { functionArgs };
