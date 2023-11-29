export default [
	{
		id: "nodular_1699757014128",
		type: "Function",
		position: {
			x: -117.89806123717328,
			y: -19.872990030818073,
		},
		data: {
			label: "isinarray",
			lang: "node",
			loading: false,
			func: "function isinarray(input, array) {\n\tvar bool = array.includes(input);\n\treturn bool;\n}\n\nmodule.exports = { isinarray }",
			args: ["input", "array"],
			returnArgs: ["isinarray"],
			funcedit: true,
			argTypes: [],
			returnType: "",
			argTypeColors: [],
			hasfunc: true,
			funceval: null,
		},
		selected: false,
		positionAbsolute: {
			x: -117.89806123717328,
			y: -19.872990030818073,
		},
		dragging: false,
	},
	{
		id: "nodular_1699757045106",
		type: "Bool",
		position: {
			x: 328.46624890846675,
			y: 92.35054683718982,
		},
		data: {
			label: "bool",
			func: "function yorno(bool) {\n\treturn !!bool;\n} module.exports = { yorno: yorno(bool) }",
			funcedit: true,
			funcnode: false,
			hasfunc: true,
			defaultNode: true,
			argTypes: ["Bolean"],
			argTypeColors: [
				{
					backgroundColor: "#3380bd",
				},
			],
			args: ["bool"],
			funceval: null,
		},
		selected: false,
		positionAbsolute: {
			x: 328.46624890846675,
			y: 92.35054683718982,
		},
		dragging: false,
	},
	{
		id: "nodular_1699757046394",
		type: "Input",
		position: {
			x: -576.9514418160303,
			y: -91.70646027754003,
		},
		data: {
			label: "input",
			// func: "const input = 'yellow';module.exports = {input }",
			defaultNode: true,
			args: [],
			returnArgs: ["input"],
			funcedit: true,
			hasfunc: false,
			returnType: "String",
			returnTypeColor: {
				backgroundColor: "#A0D468",
			},
			get func() {
				delete this.func;
				return (this.func = `const input = \`${this.funceval}\`;\n\nmodule.exports = {input }`);
			},
			funceval: "yellow",
		},
		selected: false,
		positionAbsolute: {
			x: -576.9514418160303,
			y: -91.70646027754003,
		},
		dragging: false,
	},
	{
		id: "nodular_1699757053462",
		type: "Array",
		position: {
			x: -583.4939003165633,
			y: 171.88858359761193,
		},
		data: {
			label: "array",
			func: 'function array() {\n\treturn [\n\t\t"yellow",\n\t\t"blue",\n\t\t"orange",\n\t\t"red"\n\t];\n}\nmodule.exports = {array }',
			args: [],
			defaultNode: true,
			returnArgs: ["array"],
			funcedit: true,
			hasfunc: true,
			returnType: "String",
			returnTypeColor: {
				backgroundColor: "#A0D468",
			},
			funceval: [],
		},
		selected: false,
		positionAbsolute: {
			x: -583.4939003165633,
			y: 171.88858359761193,
		},
		dragging: false,
	},
];
