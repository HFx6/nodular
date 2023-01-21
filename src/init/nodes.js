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
			func: function isinarray(input, array) {
				var bool = array.includes(input);
				return bool;
			},
			args: ["input", "array"],
			funcedit: true,
			hasfunc: true,
			funceval: null,
		},
		position: { x: 483, y: 312 },
		sourcePosition: "right",
		targetPosition: "left",
	},
	{
		id: "3",
		type: "input",
		data: {
			label: "Array:arr",
			func: function () {
				return [
					"yellow"
				]
			},
			funcedit: true,
			hasfunc: true,
			args: [],
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
			func: function (b) {
				return b;
			},
			funcedit: true,
			hasfunc: true,
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
