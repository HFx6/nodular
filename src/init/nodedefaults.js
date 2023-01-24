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
			funcedit: true,
			hasfunc: true,
			args: [],
			returnType: "Array",
			returnTypeColor: { backgroundColor: "#D19A66" },
			funceval: null,
		},
		sourcePosition: "right",
	},
};
