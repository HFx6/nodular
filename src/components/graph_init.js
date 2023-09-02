import NFunction from "../nodes/function";
import NBool from "../nodes/bool";
import NInput from "../nodes/input";
import NArray from "../nodes/array";
import JavascriptNode from "../nodes/language_nodes/JavascriptNode";
import PythonNode from "../nodes/language_nodes/PythonNode";
import CanvasNode from "../nodes/language_nodes/CanvasNode";

export const nodeTypes = {
	nodeFunction: NFunction,
	nodeBool: NBool,
	nodeInput: NInput,
	nodeArray: NArray,
	pythonNode: PythonNode,
	javascriptNode: JavascriptNode,
	canvasNode: CanvasNode,
};