import { PiTrainDuotone } from "react-icons/pi";

export default {
	nodeFunction: {
		type: "nodeFunction",
		dragHandle: ".funcnode",
		data: {
			label: "Function",
			func: "",
			args: [],
			funcedit: true,
			argTypes: [],
			returnType: "",
			argTypeColors: [],
			returnTypeColor: { backgroundColor: "#3380bd" },
			hasfunc: true,
			funceval: null,
		},
		sourcePosition: "right",
		targetPosition: "left",
	},
	javascriptNode: {
		type: "javascriptNode",
		dragHandle: ".funcnode",
		data: {
			label: "isinarray",
			lang: "node",
			loading: false,
			func: "function isinarray(input, array) {\n\tvar bool = array.includes(input);\n\treturn bool;\n}",
			args: ["input", "array"],
			funcedit: true,
			argTypes: [],
			returnType: "",
			argTypeColors: [],
			hasfunc: true,
			funceval: null,
		},
		dragging: false,
		selected: false,
		sourcePosition: "right",
		targetPosition: "left",
	},
	pythonNode: {
		type: "pythonNode",
		dragHandle: ".funcnode",
		data: {
			label: "isinarray",
			lang: "python",
			loading: false,
			func: "function isinarray(input, array) {\n\tvar bool = array.includes(input);\n\treturn bool;\n}",
			args: ["input", "array"],
			funcedit: true,
			argTypes: [],
			returnType: "",
			argTypeColors: [],
			hasfunc: true,
			funceval: null,
		},
		dragging: false,
		selected: false,
		sourcePosition: "right",
		targetPosition: "left",
	},
	nodeBool: {
		type: "nodeBool",
		data: {
			label: "Bool",
			func: `function (b) {
            return b;
        }`,
			funcedit: true,
			hasfunc: true,
			argTypes: ["Bolean"],
			argTypeColors: [{ backgroundColor: "#3380bd" }],
			args: ["b"],
			funceval: null,
		},
		targetPosition: "left",
	},
	nodeInput: {
		type: "nodeInput",
		data: {
			label: "textinput",
			func: null,
			args: [],
			funcedit: true,
			hasfunc: false,
			returnType: "String",
			returnTypeColor: { backgroundColor: "#A0D468" },
			funceval: "",
		},
		sourcePosition: "right",
	},
	nodeArray: {
		type: "nodeArray",
		data: {
			label: "Array",
			func: `function Array() {
				return [];
		}`,
			args: [],
			funcedit: true,
			hasfunc: true,
			returnType: "String",
			returnTypeColor: { backgroundColor: "#A0D468" },
			funceval: [],
		},
		sourcePosition: "right",
	},
};
