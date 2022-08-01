let svg;

function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
		(
			c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
		).toString(16)
	);
}

function toposort(graph) {
	let isVisitedNode;
	let finishTimeCount;
	let finishingTimeList;
	let nextNode;
	isVisitedNode = Object.create(null);
	finishTimeCount = 0;
	finishingTimeList = [];

	for (const node in graph) {
		if (
			Object.prototype.hasOwnProperty.call(graph, node) &&
			!isVisitedNode[node]
		) {
			dfsTraverse(node);
		}
	}

	finishingTimeList.sort(function (item1, item2) {
		return item1.finishTime > item2.finishTime ? -1 : 1;
	});

	return finishingTimeList.map(function (value) {
		return value.node;
	});

	function dfsTraverse(node) {
		isVisitedNode[node] = true;
		if (graph[node]) {
			for (let i = 0; i < graph[node].length; i++) {
				nextNode = graph[node][i];
				if (isVisitedNode[nextNode]) continue;
				dfsTraverse(nextNode);
			}
		}

		finishingTimeList.push({
			node,
			finishTime: ++finishTimeCount,
		});
	}
}

class Editor{
	constructor(){
		return{

		}
	}
}

class Canvas {
	constructor(id) {
		this.canvas = document.getElementById(id);
		this.nodes = {};
		this.connections = [];
		this.props = {};
		var dragnode = null;

		var wrkbn = document.createElement("div");
		wrkbn.className = "workbench";
		// var wrkbnimg = document.createElement("div");
		// wrkbnimg.className = "nlogo";
		var wrkbnimg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		wrkbnimg.setAttributeNS(null, "class", "wbn");
		wrkbnimg.setAttributeNS(null, "width", "24");
		wrkbnimg.setAttributeNS(null, "height", "24");
		wrkbnimg.setAttributeNS(null, "viewBox", "0 0 24 24");
		var wrkbnimgpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		wrkbnimgpath.setAttributeNS(null, "d", "M6 8C6.74028 8 7.38663 7.5978 7.73244 7H14C15.1046 7 16 7.89543 16 9C16 10.1046 15.1046 11 14 11H10C7.79086 11 6 12.7909 6 15C6 17.2091 7.79086 19 10 19H16.2676C16.6134 19.5978 17.2597 20 18 20C19.1046 20 20 19.1046 20 18C20 16.8954 19.1046 16 18 16C17.2597 16 16.6134 16.4022 16.2676 17H10C8.89543 17 8 16.1046 8 15C8 13.8954 8.89543 13 10 13H14C16.2091 13 18 11.2091 18 9C18 6.79086 16.2091 5 14 5H7.73244C7.38663 4.4022 6.74028 4 6 4C4.89543 4 4 4.89543 4 6C4 7.10457 4.89543 8 6 8Z");
		wrkbnimgpath.setAttributeNS(null, "fill", "#2196F3");
		wrkbnimgpath.setAttributeNS(null, "transform", "rotate(90 12 12)");
		wrkbnimg.appendChild(wrkbnimgpath);
		wrkbn.appendChild(wrkbnimg);
		this.workbench = this.canvas.appendChild(wrkbn);

		
		// this.tray = this.canvas.appendChild(new Tray());

		var bzp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		bzp.classList.add("bezpaths");
		this.bezpaths = this.canvas.appendChild(bzp);
		svg = this.bezpaths;
		svg.ns = svg.namespaceURI;

		this.canvas.addEventListener(
			"mouseup",
			function () {
				dragnode = null;
			},
			true
		);

		this.moveNode = function (e) {
			if (dragnode != null) {
				// console.log(dragnode);
				var node = this.nodes[dragnode].node;
				e.preventDefault();

				node.style.transform =
					"translate3d(" +
					(e.clientX + this.nodes[dragnode].xy[0]) +
					"px, " +
					(e.clientY + this.nodes[dragnode].xy[1]) +
					"px, 0)";
				this.updatePath(this.nodes[dragnode]);
			}else{
				console.log(123);
			}
		};

		this.canvas.addEventListener("mousemove", this.moveNode.bind(this), true);

		this.nodeMoveInit = function (nodeid, e) {
			dragnode = nodeid;
			this.nodes[dragnode]["xy"] = [
				this.nodes[dragnode].node.getBoundingClientRect().left - e.clientX,
				this.nodes[dragnode].node.getBoundingClientRect().top - e.clientY,
			];
		};

		return {
			canvas: this.canvas,
			nodes: this.nodes,
			connections: this.connections,
			props: this.props,
			workbench: this.workbench,
			bezpaths: this.bezpaths,
			tray: this.tray,
			add: this.add.bind(this),
			connect: this.connect.bind(this),
			run: this.exec.bind(this),
			sorting: this.dependencyTree.bind(this),
		};
	}

	dependencyTree() {
		var list = {};
		var l = this.connections;
		Object.keys(this.nodes).forEach((key) => {
			list[key] = [];
		});
		l.forEach((conn) => {
			list[conn.outputnodeid].push(conn.inputnodeid);
		});
		return toposort(list);
		// return list;
	}

	exec() {
		// var runloop = this.connections;
		// for (var i = 0; i < runloop.length; i++) {
		//   var o = runloop[i].outputnodeid;
		//   var i = runloop[i].inputnodeid;
		//   console.log(this.nodes[i].function([this.nodes[o].function()]));
		// }
		var runloop = this.dependencyTree();
		runloop.forEach((nodeid) => {
			console.log(this.nodes[nodeid].function());
		});
	}

	add(nodeobj) {
		var node = nodeobj.node;
		this.canvas.appendChild(node);
		this.nodes[nodeobj.id] = nodeobj;
		node.addEventListener(
			"mousedown",
			this.nodeMoveInit.bind(this, nodeobj.id),
			false
		);
	}
	createPath(i1, i2) {
		var diff = {
			x: i2.x - i1.x,
			y: i2.y - i1.y,
		};

		var pathStr = "M" + i1.x + "," + i1.y + " ";
		pathStr += "C";
		pathStr += i1.x + (diff.x / 3) * 2 + "," + i1.y + " ";
		pathStr += i1.x + diff.x / 3 + "," + i2.y + " ";
		pathStr += i2.x + "," + i2.y;

		return pathStr;
	}

	connect(output, input) {
		// var nodein;
		// console.log(input, output);
		input.pearl.classList.add("connected");
		output.pearl.classList.add("connected");
		input.fromId = output.nodeid;
		var d = {
			input: input,
			output: output,
			path: input.path,
			inputnodeid: input.nodeid,
			outputnodeid: output.nodeid,
		};
		this.connections.push(d);
		// glconnections.push(d);
		// node.connections.push(d);

		var iPoint = input.position;
		var oPoint = output.position;
		// console.log(iPoint, oPoint);
		var pathStr = this.createPath(iPoint, oPoint);
		input.path.setAttributeNS(null, "d", pathStr);
		svg.appendChild(input.path);
		// console.log(input.path);
		output.path.setAttributeNS(null, "d", pathStr);
		// console.log(node.inputs[innum], this.props.outputs[innum]);
		this.checkConnections(input.nodeid);
	}

	updatePath() {
		var paths = this.connections;
		// var paths = glconnections;
		for (var i = 0; i < paths.length; i++) {
			var input = paths[i].input;
			var output = paths[i].output;
			var path = paths[i].path;
			var iPoint = input.position;
			var oPoint = output.position;
			var pathStr = this.createPath(iPoint, oPoint);
			path.setAttributeNS(null, "d", pathStr);
		}
	}

	endRun(node) {
		var args = [];
		for (var ii in node.inputs) {
			args.push(node.inputs[ii].funcvalue);
		}
		node.function(args);
	}

	getOutput(nid) {

		if (Object.keys(this.nodes[nid].inputs).length == 0) {
			return this.nodes[nid].function();
		} else {
			this.checkConnections(nid);
		}
	}

	async checkConnections(connId) {
		var node = this.nodes[connId];
		var count = Object.keys(node.inputs).length;
		for (var input in node.inputs) {
			var curi = node.inputs[input];
			if (curi.pearl.classList.contains("connected")) {
				curi.funcvalue = this.getOutput(curi.fromId);
				count -= 1;
			}
		}
		if (Object.keys(node.outputs).length == 0 && count == 0) this.endRun(node)
	}
}

class Node {
	constructor(name = "node") {
		this.id = uuidv4();
		this.name = name;

		var node = document.createElement("div");
		node.className = "node";
		node.id = this.id;
		this.node = node;

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

		// this.connections = [];

		this.function = "";

		this.props = {
			inputs: {},
			outputs: {},
			// function: '',
		};
		return {
			node: node,
			id: this.id,
			moveTo: this.moveTo.bind(this),
			addInput: this.addInput.bind(this),
			addOutput: this.addOutput.bind(this),
			inputs: this.props.inputs,
			outputs: this.props.outputs,
			setFunc: this.setFunc.bind(this),
			function: this.func.bind(this),
			// connectTo: this.connectTo.bind(this),
		};
	}

	setFunc(i) {
		// console.log(this);
		this.function = i;
	}

	func(i) {
		return this.function.apply(this, i);
	}

	moveTo(x, y) {
		this.node.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
	}

	// add inputs
	addInput(name = "input", title = "") {
		var nodein = document.createElement("div");
		var inpearl = document.createElement("div");
		var inlabel = document.createElement("div");
		// this.connected = false;
		this.path = document.createElementNS(svg.ns, "path");
		this.path.setAttributeNS(null, "stroke", "#44535a");
		this.path.setAttributeNS(null, "stroke-width", "5");
		this.path.setAttributeNS(null, "fill", "none");
		// svg.appendChild(this.path);

		var inid = Object.keys(this.props.inputs).length;
		var data = {
			get position() {
				const pos = inpearl.getBoundingClientRect();
				return {
					x: pos.x + pos.width - 5,
					y: pos.y + pos.height * 0.5 + 1,
				};
			},
			// get connected(){
			// 	return this.connected;
			// },
			path: this.path,
			pearl: inpearl,
			nodeid: this.node.id,
			inid: inid,
			funcvalue: null,
			fromId: null,
		};

		nodein.className = "nodein";
		inpearl.className = "inpearl";

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
		this.path = document.createElementNS(svg.ns, "path");
		this.path.setAttributeNS(null, "stroke", "#44535a");
		this.path.setAttributeNS(null, "stroke-width", "5");
		this.path.setAttributeNS(null, "fill", "none");
		// svg.appendChild(this.path);

		var outid = Object.keys(this.props.outputs).length;

		var data = {
			get position() {
				const pos = outpearl.getBoundingClientRect();
				return {
					x: pos.x + pos.width - 5,
					y: pos.y + pos.height * 0.5 + 1,
				};
			},
			path: this.path,
			pearl: outpearl,
			nodeid: this.node.id,
			outide: outid,
		};

		nodeout.className = "nodeout";
		outpearl.className = "outpearl";

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
}

class Tray{
	constructor(node){
		var tray = document.createElement("div");
		tray.className = "tray";
		tray.id = "resizeMe";
			var traycontainer = document.createElement("div");
			traycontainer.className = "traycontainer";
				var dragcol = document.createElement("div");
				dragcol.className = "dragcol";
				traycontainer.appendChild(dragcol);
					var drag = document.createElement("div");
					drag.className = "drag";
					dragcol.appendChild(drag);
				var content = document.createElement("div");
				content.className = "content";
				traycontainer.appendChild(content);
					var header = document.createElement("div");
					header.className = "header";
					content.appendChild(header);
						var back = document.createElement("div");
						back.className = "back";
						header.appendChild(back);
						var name = document.createElement("div");
						name.className = "name";
						name.innerHTML = "<p>node</p>";
						header.appendChild(name);
						var delet = document.createElement("div");
						delet.className = "delete";
						header.appendChild(delet);
				var connections = document.createElement("div");
				connections.className = "connections";
				connections.innerHTML = "<p>connections</p>";
				content.appendChild(connections);
				var ide = document.createElement("div");
				ide.className = "ide";
				content.appendChild(ide);
				var linec = document.createElement("div");
					linec.className = "linec";
					linec.innerHTML = "1"
					ide.appendChild(linec);
					var idecode = document.createElement("textarea");
					idecode.className = "idecode";
					idecode.value = 'hello world';
					idecode.setAttribute("oninput", "lineFeed()");
					idecode.setAttribute("data-gramm", "false");
					idecode.setAttribute("autocomplete", "off");
					idecode.setAttribute("autocorrect", "off");
					idecode.setAttribute("spellcheck", "false");
					ide.appendChild(idecode);
		tray.appendChild(traycontainer);

		back.addEventListener('click', function(){
			tray.remove();
		});

		let x = 0;
		let w = 0;
	
		const mouseDownHandler = function (e) {
			e.preventDefault();
			x = e.clientX;
			const styles = tray.getBoundingClientRect();
			w = parseInt(styles.width, 10);
			document.addEventListener('mousemove', mouseMoveHandler);
			document.addEventListener('mouseup', mouseUpHandler);
		};
	
		const mouseMoveHandler = function (e) {
			e.preventDefault();
			const dx = e.clientX - x;
			tray.style.width = `${w - dx}px`;
		};
	
		const mouseUpHandler = function () {
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		};
	
		
		dragcol.addEventListener('mousedown', mouseDownHandler);
		

		return tray;
	}
}