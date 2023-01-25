export default [
    {
        "width": 184,
        "height": 41,
        "id": "nodular_1674617452969",
        "type": "nodeInput",
        "position": {
            "x": 262,
            "y": 232
        },
        "data": {
            "label": "textinput",
            "func": null,
            "args": [],
            "funcedit": true,
            "hasfunc": false,
            "returnType": "String",
            "returnTypeColor": {
                "backgroundColor": "#A0D468"
            },
            "funceval": "yellow"
        },
        "selected": false,
        "positionAbsolute": {
            "x": 262,
            "y": 232
        },
        "dragging": false
    },
    {
        "width": 122,
        "height": 131,
        "id": "nodular_1674617454424",
        "type": "nodeFunction",
        "position": {
            "x": 589,
            "y": 280
        },
        "data": {
            "label": "isinarray",
            "func": "// /*\n// * @param {String} input\n// * @param {Array} array\n// * @return {Boolean}\n// */\nfunction isinarray(input, array) {\n\tvar bool = array.includes(input);\n\treturn bool;\n}",
            "args": [
                "input",
                "array"
            ],
            "funcedit": true,
            "argTypes": [],
            "returnType": "",
            "argTypeColors": [
                {
                    "backgroundColor": "#A0D468"
                },
                {
                    "backgroundColor": "#D19A66"
                }
            ],
            "returnTypeColor": {
                "backgroundColor": "#3380bd"
            },
            "hasfunc": true,
            "funceval": true
        },
        "selected": false,
        "positionAbsolute": {
            "x": 589,
            "y": 280
        },
        "dragging": false
    },
    {
        "width": 184,
        "height": 54,
        "id": "nodular_1674617455066",
        "type": "nodeArray",
        "position": {
            "x": 251,
            "y": 392
        },
        "data": {
            "label": "Array",
            "func": "function Array() {\n\treturn [\"yellow\"];\n}",
            "funcedit": true,
            "hasfunc": true,
            "args": [],
            "returnType": "Array",
            "funceval": [
                "yellow"
            ],
            "argTypeColors": []
        },
        "selected": false,
        "dragging": false,
        "positionAbsolute": {
            "x": 251,
            "y": 392
        }
    },
    {
        "width": 184,
        "height": 54,
        "id": "nodular_1674617455844",
        "type": "nodeBool",
        "position": {
            "x": 983,
            "y": 381
        },
        "data": {
            "label": "Bool",
            "func": "function (b) {\n            return b;\n        }",
            "funcedit": true,
            "hasfunc": true,
            "argTypes": [
                "Bolean"
            ],
            "argTypeColors": [
                {
                    "backgroundColor": "#3380bd"
                }
            ],
            "args": [
                "b"
            ],
            "funceval": true
        },
        "selected": false,
        "positionAbsolute": {
            "x": 983,
            "y": 381
        },
        "dragging": false
    }
];
