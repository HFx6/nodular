export default [
	{
		id: "1",
		type: "nodeInput",
		data: {
			label: "textinput",
			func: null,
			args: [],
			funcedit: true,
			hasfunc: false,
			returnType: "String",
			returnTypeColor: {backgroundColor: "#A0D468"},
			funceval: "yellow",
		},
		position: { x: 177, y: 178 },
		sourcePosition: "right",
	},
	{
		id: "2",
		type: "nodeFunction",
		dragHandle: ".funcnode",
		data: {
			label: "isInArray",
			func:`
				// /*
				// * @param {String} input
				// * @param {Array} array
				// * @return {Boolean}
				// */
				function isinarray(input, array) {
					var bool = array.includes(input);
					return bool;
				}`,
			args: ["input", "array"],
			funcedit: true,
			argTypes: ["String", "Array"],
			returnType: "Boolean",
			argTypeColors: [
				{ backgroundColor: "#A0D468" },
				{ backgroundColor: "#D19A66" },
			],
			returnTypeColor: {backgroundColor: "#3380bd"},
			hasfunc: true,
			funceval: null,
		},
		position: { x: 483, y: 312 },
		sourcePosition: "right",
		targetPosition: "left",
	},
	{
		id: "3",
		type: "nodeArray",
		data: {
			label: "Array",
			func: `function Array() {
				return ["yellow"];
			}`,
			funcedit: true,
			hasfunc: true,
			args: [],
			returnType: "Array",
			returnTypeColor: {backgroundColor: "#D19A66"},
			funceval: null,
		},
		position: { x: 163, y: 389 },
		sourcePosition: "right",
	},
	{
		id: "4",
		type: "nodeBool",
		data: {
			label: "Bool",
			func: `function (b) {
				return b;
			}`,
			funcedit: true,
			hasfunc: true,
			argTypes: ["Bolean"],
			argTypeColors: [
				{ backgroundColor: "#3380bd" },
			],
			args: ["b"],
			funceval: null,
		},
		position: { x: 949, y: 212 },
		targetPosition: "left",
	},
	// {
	// 	id: "5",
	// 	type: "nodeFunction",
	// 	dragHandle: ".funcnode",
	// 	data: {
	// 		label: "testFunction",
	// 		func: `function testFunction(a,b,c) {
	// 			return 6;
	// 		}`,
	// 		args: ["a", "b", "c"],
	// 		funcedit: true,
	// 		funceval: null,
	// 	},
	// 	position: { x: 483, y: 450 },
	// 	sourcePosition: "right",
	// 	targetPosition: "left",
	// }
];
