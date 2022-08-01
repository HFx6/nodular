const canvas = document.getElementById("canvas");
const svg = document.getElementsByClassName("bezpaths")[0];
svg.ns = svg.namespaceURI;
var nodelist = {};
var dragnode = null;

var currentnodes = {};
var glconnections = [];

function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
		(	c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
		).toString(16)
	);
}

// https://codepen.io/Davenchy/pen/VqRLaZ

class Node {
	constructor(name = "default") {
		this.name = name;
		var id = uuidv4();
		var node = document.createElement("div");
		node.className = "node";
		node.id = id;

		var nodeheader = document.createElement("div");
		nodeheader.className = "nodeheader";

		var nodetitle = document.createElement("div");
		nodetitle.className = "nodetitle";

		var titlespan = document.createElement("span");
		titlespan.innerText = this.name;
		nodetitle.appendChild(titlespan);

		var cimg = document.createElement("img");
		cimg.src = "code.svg";
		cimg.className = "codeopen";

		var nodebody = document.createElement("div");
		nodebody.className = "nodebody";

		var inputs = document.createElement("div");
		inputs.className = "inputs";

		var outputs = document.createElement("div");
		outputs.className = "outputs";

		nodeheader.appendChild(nodetitle);
		nodeheader.appendChild(cimg);
		node.appendChild(nodeheader);
		node.appendChild(nodebody);

		this.inputs = nodebody.appendChild(inputs);
		this.outputs = nodebody.appendChild(outputs);
		
		this.node = canvas.appendChild(node);

		this.connections = [];

		this.props = {
			inputs: {},
			outputs: {},
		};
		node.addEventListener(
			"mousedown",
			function (e) {
				var nodee = document.getElementById(id);
				nodelist[id] = [
					true,
					[
						nodee.getBoundingClientRect().left - e.clientX,
						nodee.getBoundingClientRect().top - e.clientY,
					]
				];
				dragnode = id;
				// e.stopPropagation();
			},
			false
		);
		currentnodes[id] = this;
		return {
			/* props */
			inputs: this.props.inputs,
			outputs: this.props.outputs,
			/* methods */
			connections: this.connections,
			addInput: this.addInput.bind(this),
			addOutput: this.addOutput.bind(this),
			connectTo: this.connectTo.bind(this),
			moveTo: this.moveTo.bind(this),
			updatePath: this.updatePath.bind(this),
			detachInput: this.detachInput.bind(this),
			detachOutput: this.detachOutput.bind(this),
			id: node.id,
		};
	}
	
	moveTo(x, y){
		this.node.style.transform =
					"translate3d(" +
					x +
					"px, " +
					y +
					"px, 0)";
	}

	// add inputs
	addInput(name = "input", title = "") {
		var nodein = document.createElement("div");
		var inpearl = document.createElement("div");
		var inlabel = document.createElement("div");
		// this.connected = false;
		this.path = document.createElementNS(svg.ns, 'path');
		this.path.setAttributeNS(null, 'stroke', '#44535a');
		this.path.setAttributeNS(null, 'stroke-width', '5');
		this.path.setAttributeNS(null, 'fill', 'none');
		// svg.appendChild(this.path);
		var data = {
			get type() {
				return "input";
			},
			get name() {
				return nodein.innerText;
			},
			set name(v) {
				nodein.innerText = v;
			},
			get title() {
				return nodein.getAttribute("title");
			},
			set title(v) {
				nodein.setAttribute("title", v);
			},
			get rect() {
				return nodein.getBoundingClientRect();
			},
			get position() {
				const pos = inpearl.getBoundingClientRect();
				return {
					x: pos.x + pos.width - 5,
					y: pos.y + pos.height / 2 + 1,
				};
			},
			// get connected(){
			// 	return this.connected;
			// },
			path: this.path,
			pearl: inpearl,
		};

		nodein.className = "nodein";
		inpearl.className = "inpearl";
		var inid = Object.keys(this.props.inputs).length;
		inpearl.setAttribute("data-inid", inid);
		// inpearl.setAttribute("data-type", "");
		nodein.appendChild(inpearl);
		inlabel.innerText = name;
		inlabel.className = "inlabel";
		nodein.appendChild(inlabel);

		
		this.props.inputs[inid] = data;
		nodein.data = data;
		nodein = this.inputs.appendChild(nodein);
		inpearl.addEventListener(
			"mousedown",
			function (e) {
				e.stopPropagation();
			},
			false
		);
		return data;
	}

	addOutput(name = "input", title = "") {
		var nodeout = document.createElement("div");
		var outpearl = document.createElement("div");
		var outlabel = document.createElement("div");
		// this.connected = false;
		this.path = document.createElementNS(svg.ns, 'path');
		this.path.setAttributeNS(null, 'stroke', '#44535a');
		this.path.setAttributeNS(null, 'stroke-width', '5');
		this.path.setAttributeNS(null, 'fill', 'none');
		// svg.appendChild(this.path);

		var data = {
			get type() {
				return "input";
			},
			get name() {
				return nodeout.innerText;
			},
			set name(v) {
				nodeout.innerText = v;
			},
			get title() {
				return nodeout.getAttribute("title");
			},
			set title(v) {
				nodeout.setAttribute("title", v);
			},
			get rect() {
				return nodeout.getBoundingClientRect();
			},
			get position() {
				const pos = outpearl.getBoundingClientRect();
				return {
					x: pos.x + pos.width,
					y: pos.y + pos.height / 2 + 1,
				};
			},
			path: this.path,
			pearl: outpearl,
		};

		nodeout.className = "nodeout";
		outpearl.className = "outpearl";
		var outid = Object.keys(this.props.outputs).length;
		outpearl.setAttribute("data-outid", outid);
		// outpearl.setAttribute("data-type", "");
		nodeout.appendChild(outpearl);
		outlabel.innerText = name;
		outlabel.className = "outlabel";
		nodeout.appendChild(outlabel);

		this.props.outputs[outid] = data;
		nodeout.data = data;
		nodeout = this.outputs.appendChild(nodeout);
		return data;
	}

	createPath(i1, i2){
		var diff = {
		  x: i2.x - i1.x,
		  y: i2.y - i1.y
		};
		
		var pathStr = 'M' + i1.x + ',' + i1.y + ' ';
		pathStr += 'C';
		pathStr += i1.x + diff.x / 3 * 2 + ',' + i1.y + ' ';
		pathStr += i1.x + diff.x / 3 + ',' + i2.y + ' ';
		pathStr += i2.x + ',' + i2.y;
		
		return pathStr;
	 };

	connectTo(node, innum) {
		// this.connected = true;
		// console.log(node.inputs[innum]);
		// this.domElement.classList.add('connected');
		
		// input.domElement.classList.remove('empty');
		// input.domElement.classList.add('filled');
		node.inputs[innum].pearl.classList.add('connected');
		this.props.outputs[0].pearl.classList.add('connected');
		
		var d = {
			input: node.inputs[innum],
			output: this.props.outputs[0],
			path: node.inputs[innum].path,
			inputnodeid: node.id,
			outputnodeid: this.node.id,
			inid: 0,
			outid: 0,
		 }
		this.connections.push(d);
		glconnections.push(d);
		node.connections.push(d);
		
		var iPoint = node.inputs[innum].position;
		var oPoint = this.props.outputs[0].position;
		
		var pathStr = this.createPath(iPoint, oPoint);
		node.inputs[innum].path.setAttributeNS(null, 'd',pathStr);
		svg.appendChild(node.inputs[innum].path);
		// this.props.outputs[innum].path.setAttributeNS(null, 'd',pathStr);
		// console.log(node.inputs[innum], this.props.outputs[innum]);
	}

	updatePath(){
		var paths = this.connections;
		// var paths = glconnections;
		for(var i = 0; i < paths.length; i++){
			var input = paths[i].input;
			var output = paths[i].output;
			var path = paths[i].path;
			var iPoint = input.position;
			var oPoint = output.position;
			var pathStr = this.createPath(iPoint, oPoint);
			path.setAttributeNS(null, 'd',pathStr);
		}
	}

	detachInput(innum) {
		// this.connected = false;
		this.props.inputs[innum].pearl.classList.remove('connected');
		// this.props.outputs[innum].path.removeAttribute('d');
		console.log(this.props);
	}

	detachOutput(innum) {
		// this.connections[innum].output.pearl.classList.remove('connected');
		// this.connections[innum].input.pearl.classList.remove('connected');
		// delete this.connections[innum];
		console.log(this.connections);
	}

}

canvas.addEventListener(
	"mouseup",
	function () {
		if(dragnode){
			nodelist[dragnode][0] = false;
			dragnode = null;
		}
		
	},
	true
);
canvas.addEventListener(
	"mousemove",
	function (event) {
		if (dragnode != null) {
			var node = nodelist[dragnode];
			event.preventDefault();
			var truenode = document.getElementById(dragnode);
			if (node[0]) {
				currentnodes[dragnode].updatePath();
				truenode.style.transform =
					"translate3d(" +
					(event.clientX + node[1][0]) +
					"px, " +
					(event.clientY + node[1][1]) +
					"px, 0)";
			}
		}
	},
	true
);

