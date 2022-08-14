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

class Editor {
	constructor(id) {
		this.id = id;
		this.canvas = new Canvas(id);
		return {
			canvas: this.canvas,
			connections: this.canvas.connections,
			addNode: this.addNode.bind(this),
			connect: this.connect.bind(this),
		};
	}

	waitForElement(elementId, callBack) {
		window.setTimeout(function () {
			var element = document.getElementById(elementId);
			if (element) {
				callBack(elementId, element);
			} else {
				waitForElement(elementId, callBack);
			}
		}, 100);
	}

	connect(output, input) {
		this.waitForElement("canvas", () => {
			this.canvas.connect(output, input);
		});
	}

	addNode(nodeobj) {
		this.canvas.addNode(nodeobj);
	}
}

class Canvas {
	constructor(id) {
		this.activeNode = { 0: "hello world" };
		if (!this.activeNode[0] == null) {
			console.log(1);
		}

		this.nodes = {};
		this.connections = [];
		this.props = {};

		this.canvas = document.getElementById(id);
		this.nodewrapper = document.createElement("div");
		this.traywrapper = document.createElement("div");
		this.nwoffset = {
			x: 0,
			y: 0,
		};

		this.nodewrapper.className = "nodewrapper";

		this.overlay = new Overlay(this.activeNode);

		this.overlay.createNavbar();
		this.overlay.createZoom();
		// this.overlay.createTray();
		this.props.tray = this.canvas.appendChild(this.traywrapper);
		this.canvas.appendChild(this.overlay.props.navbar);
		this.canvas.appendChild(this.overlay.props.zoom);

		this.canvas.appendChild(this.nodewrapper);

		var bzp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		bzp.classList.add("bezpaths");
		bzp.style.overflow = "visible";
		this.bezpaths = this.nodewrapper.appendChild(bzp);
		svg = this.bezpaths;
		svg.ns = svg.namespaceURI;
		this.dragElement(this.canvas, this.nodewrapper, this.bezpaths);
		return {
			canvas: this.canvas,
			nodes: this.nodes,
			connections: this.connections,
			addNode: this.addNode.bind(this),
			connect: this.connect.bind(this),
			sorting: this.dependencyTree.bind(this),
			saveJSON: this.saveJSON.bind(this),
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

	addNode(nodeobj) {
		nodeobj.props.svgoffsets = this.nwoffset;
		var node = nodeobj.node;

		nodeobj.cimg.addEventListener("click", () => {
			this.overlay.createTray(this.nodes, nodeobj.id);
			this.traywrapper.replaceChildren(this.overlay.props.tray);
			window.requestAnimationFrame(() => {
				this.overlay.props.tray.style.transform = "translateX(0%)";
			});
		});

		this.nodewrapper.appendChild(node);
		this.nodes[nodeobj.id] = nodeobj;
	}

	connect(output, input) {
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
		this.nodes[input.nodeid].props.connections.push(d);
		this.nodes[output.nodeid].props.connections.push(d);

		var iPoint = input.position;
		var oPoint = output.position;
		var pathStr = this.createPath(iPoint, oPoint);

		d.path.setAttributeNS(null, "d", pathStr);
		svg.appendChild(d.path);
		output.path.setAttributeNS(null, "d", pathStr);
		input.path.setAttributeNS(null, "d", pathStr);
		this.checkConnections(input.nodeid);
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

	dragElement(canvas, nodewrapper, bezpaths) {
		var pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		canvas.onpointerdown = dragMouseDown;
		var that = this;
		function dragMouseDown(e) {
			if (e.target == canvas || e.target == nodewrapper) {
				e.stopPropagation();
				e.preventDefault();
				e = e || window.event;
				pos3 = parseInt(e.clientX);
				pos4 = parseInt(e.clientY);
				document.onpointerup = closeDragElement;
				document.onpointermove = elementDrag;
				return false;
			}
		}

		function elementDrag(e) {
			e = e || window.event;
			pos1 = pos3 - parseInt(e.clientX);
			pos2 = pos4 - parseInt(e.clientY);
			pos3 = parseInt(e.clientX);
			pos4 = parseInt(e.clientY);
			canvas.style.cursor = 'grabbing';
			var nwbc = nodewrapper.getBoundingClientRect();
			that.nwoffset.x = parseInt(nwbc.left - pos1);
			that.nwoffset.y = parseInt(nwbc.top - pos2);
			// that.updatePath();
			canvas.style.backgroundPositionX = nwbc.left - pos1 + "px";
			canvas.style.backgroundPositionY = nwbc.top - pos2 + "px";
			// nodewrapper.style.transform = `matrix(1.2,0,0,1.2,${(nwbc.left - pos1)}, ${(nwbc.top - pos2)})`;
			nodewrapper.style.transform = `translate(${nwbc.left - pos1}px, ${nwbc.top - pos2
				}px)`;
		}

		function closeDragElement() {
			canvas.style.cursor = 'default';
			document.onpointerup = null;
			document.onpointermove = null;
		}
	}

	endRun(node) {
		var args = [];
		for (var ii in node.inputs) {
			args.push(node.inputs[ii].funcvalue);
		}
		node.props.function(...args);
	}

	getOutput(nid) {
		if (Object.keys(this.nodes[nid].inputs).length == 0) {
			return this.nodes[nid].props.function();
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
		if (Object.keys(node.outputs).length == 0 && count == 0) this.endRun(node);
	}

	saveJSON() {
		// from connectons and nodes
		var jsonsave = {
			connections: this.connections,
			nodes: this.nodes
		}
		console.log(jsonsave);
	}

	loadJSON() {
		// from json load nodes and connect and set functions
	}

}

class Node {
	constructor(name = "NODE") {
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
		this.titlespan = nodetitle.appendChild(titlespan);

		var cimg = document.createElement("span");
		// cimg.src = "code.svg";
		cimg.className = "codeopen";
		cimg.innerHTML = "&#8249;&#8250;";

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

		// this.function = "";

		this.props = {
			connections: [],
			inputs: {},
			outputs: {},
			name: name,
			function: "",
		};
		this.dragElement(node);

		return {
			node: node,
			id: this.id,
			moveTo: this.moveTo.bind(this),
			addInput: this.addInput.bind(this),
			addOutput: this.addOutput.bind(this),
			inputs: this.props.inputs,
			outputs: this.props.outputs,
			props: this.props,
			setFunc: this.setFunc.bind(this),
			function: this.func.bind(this),
			funcstr: this.funcstr.bind(this),
			changeName: this.changeName.bind(this),
			cimg: cimg,
		};
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

	changeName(newname) {
		this.props.name = newname;
		this.titlespan.innerText = newname;
	}

	updatePath() {
		var paths = this.props.connections;
		// fastdom.mutate(() => {
		for (var i = 0; i < paths.length; i++) {
			var input = paths[i].input;
			var output = paths[i].output;
			var path = paths[i].path;
			var iPoint = input.position;
			var oPoint = output.position;
			var pathStr = this.createPath(iPoint, oPoint);
			path.setAttributeNS(null, "d", pathStr);
		}
		// });
	}

	dragElement(elmnt) {
		var pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		elmnt.onpointerdown = dragMouseDown;
		var x = 0,
			y = 0;
		var that = this;
		this.dragElement.z = this.dragElement.z || 1;
		function dragMouseDown(e) {
			that.node.style.zIndex = ++that.dragElement.z;
			e.stopPropagation();
			e = e || window.event;
			pos3 = parseInt(e.clientX);
			pos4 = parseInt(e.clientY);
			(x = e.offsetX), (y = e.offsetY);
			document.onpointerup = closeDragElement;
			document.onpointermove = elementDrag;
			return false;
		}

		function scaleT(v) {
			return (1 / 1.2) * v;
		}

		function elementDrag(e) {
			e = e || window.event;
			pos1 = pos3 - parseInt(e.clientX);
			pos2 = pos4 - parseInt(e.clientY);
			pos3 = parseInt(e.clientX);
			pos4 = parseInt(e.clientY);

			// elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
			// elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

			elmnt.style.cssText +=
				"; left: " +
				(elmnt.offsetLeft - pos1) +
				"px; top: " +
				(elmnt.offsetTop - pos2) +
				"px;";
			that.updatePath();
		}

		function closeDragElement() {
			document.onpointerup = null;
			document.onpointermove = null;
		}
	}

	setFunc(i) {
		this.props.function = i;
	}

	func(i) {
		return this.props.function.apply(this, i);
	}

	funcstr() {
		return this.props.function.toString();
	}

	moveTo(x, y) {
		this.node.style.transform = "translate(" + x + "px, " + y + "px)";
		this.updatePath();
	}

	addInput(name = "input", title = "") {
		var nodein = document.createElement("div");
		var inpearl = document.createElement("div");
		var inlabel = document.createElement("div");
		this.path = document.createElementNS(svg.ns, "path");
		this.path.setAttributeNS(null, "stroke", "#44535a");
		this.path.setAttributeNS(null, "stroke-width", "4");
		this.path.setAttributeNS(null, "fill", "none");

		var inid = Object.keys(this.props.inputs).length;
		var tops = this.props.svgoffsets;
		var data = {
			get position() {
				const pos = inpearl.getBoundingClientRect();
				return {
					x: pos.x + pos.width - 9.5 - tops.x,
					y: pos.y + pos.height * 0.5 + 1 - tops.y,
				};
			},
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
		this.path = document.createElementNS(svg.ns, "path");
		this.path.setAttributeNS(null, "stroke", "#44535a");
		this.path.setAttributeNS(null, "stroke-width", "4");
		this.path.setAttributeNS(null, "fill", "none");

		var outid = Object.keys(this.props.outputs).length;
		var tops = this.props.svgoffsets;
		var data = {
			get position() {
				var pos = outpearl.getBoundingClientRect();
				return {
					x: pos.x + pos.width - 9.5 - tops.x,
					y: pos.y + pos.height * 0.5 + 1 - tops.y,
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

class Overlay {
	constructor(activenodedata) {
		// https://stackoverflow.com/questions/26421777/find-the-bounding-box-that-contains-all-div

		this.props = {
			navbar: this.navbar,
			zoom: this.zoom,
			tray: this.tray,
		};

		this.activenodepre = activenodedata;

		return {
			props: this.props,
			createTray: this.createTray.bind(this),
			createZoom: this.createZoom.bind(this),
			createNavbar: this.createNavbar.bind(this),
		};
	}

	createTray(nodelist, id) {
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
		back.className = "doublearrow";
		back.innerHTML = "&#8250;&#8250;";
		header.appendChild(back);

		var name = document.createElement("input");
		name.className = "name";
		name.setAttribute('value', nodelist[id].props.name);
		name.addEventListener('input', function (evt) {
			nodelist[id].changeName(name.value);
		});
		// name.innerHTML = `<input value='${nodelist[id].props.name}'/>`;

		header.appendChild(name);
		var delet = document.createElement("div");
		delet.className = "delete";
		delet.innerHTML = "&#215;";
		header.appendChild(delet);
		var ide = document.createElement("div");
		ide.className = "ide";

		var linesep = document.createElement("div");
		linesep.className = "linesep";
		content.appendChild(linesep);

		content.appendChild(ide);
		var idecode = document.createElement("code");
		idecode.setAttribute("contenteditable", "true");
		nodelist[id].funcstr().split("\n").forEach(pstring => {
			idecode.innerHTML += `<p>${pstring.trim()}</p>`;
		});
		function getFuncArgs(func) {
			function getFuncInArgs(func) {
				var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];
				return args.split(',').map(function (arg) {
					return arg.replace(/\/\*.*\*\//, '').trim();
				}).filter(function (arg) {
					return arg;
				});
			}
			function getFuncOutArgs(func) {
				var returnValue = func.toString().match(/return\s.*?\;/);
				if (returnValue) {
					return returnValue[0].split(',').map(function (arg) {
						return arg.replace(/return\s/, '').replace(/\;/, '').trim();
					}).filter(function (arg) {
						return arg;
					});
				} else {
					return [];
				}
			}
			return { "inputs": getFuncInArgs(func), "outputs": getFuncOutArgs(func) }
		}
		// 		var functionString = 'function(a,b) { console.log(a,b); return a + b; }';
		// var functionStringWithArgument = functionString.replace(/\)/, ', c)');
		console.log(getFuncArgs(nodelist[id].funcstr()));
		ide.appendChild(idecode);
		tray.appendChild(traycontainer);

		// https://jsfiddle.net/hdu634rq/2/
		// https://jsfiddle.net/k0badwqj/

		back.addEventListener("click", function () {
			// tray.remove();
			tray.style.transform = `translateX(calc(100% + ${tray.getBoundingClientRect().top}px))`
		});

		let x = 0;
		let w = 0;

		const mouseDownHandler = function (e) {
			e.preventDefault();
			e.stopPropagation();
			x = e.clientX;
			const styles = tray.getBoundingClientRect();
			w = parseInt(styles.width, 10);
			document.addEventListener("mousemove", mouseMoveHandler);
			document.addEventListener("mouseup", mouseUpHandler);
		};

		const mouseMoveHandler = function (e) {
			e.preventDefault();
			const dx = e.clientX - x;
			tray.style.width = `${w - dx}px`;
		};

		const mouseUpHandler = function () {
			document.removeEventListener("mousemove", mouseMoveHandler);
			document.removeEventListener("mouseup", mouseUpHandler);
		};

		dragcol.addEventListener("mousedown", mouseDownHandler);

		this.props.tray = tray;
	}

	createZoom() {
		var zoom = document.createElement("div");
		zoom.className = "zoom";

		var currentzoom = 50;

		var zoomamountdiv = document.createElement("div");
		zoomamountdiv.className = "zoomamountdiv";

		var zoombox = document.createElement("div");
		zoombox.className = "zoombox";

		var zoomout = document.createElement("p");
		zoomout.className = "zoomout";
		zoomout.innerHTML = "&#8722;";
		zoombox.appendChild(zoomout);
		var zoomamount = document.createElement("span");
		zoomamount.className = "zoomamount";
		zoomamount.innerHTML = "50%";
		zoombox.appendChild(zoomamount);
		var zoomin = document.createElement("p");
		zoomin.className = "zoomin";
		zoomin.innerHTML = "&#43;";

		zoomin.addEventListener('click', function (evt) {
			if (currentzoom < 100) {
				currentzoom += 25;
				var zoomperc = Math.min(currentzoom, 100);
				zoomamountdiv.style.width = zoomperc + "%";
				zoomamount.innerHTML = zoomperc + "%";
			}
		});

		zoomout.addEventListener('click', function (evt) {
			if (currentzoom > 0) {
				currentzoom -= 25;
				var zoomperc = Math.max(currentzoom, 0);
				zoomamountdiv.style.width = zoomperc + "%";
				zoomamount.innerHTML = zoomperc + "%";
			}
		});

		zoombox.appendChild(zoomin);

		zoom.appendChild(zoombox);
		zoom.appendChild(zoomamountdiv);

		this.props.zoom = zoom;
	}

	createNavbar() {
		var control = document.createElement("div");
		control.className = "control";

		var details = document.createElement("div");
		details.className = "details";
		var projectname = document.createElement("span");
		projectname.className = "projectname";
		projectname.innerText = "Project Name";
		var projectauth = document.createElement("span");
		projectauth.className = "projectauth";
		projectauth.innerText = "John Doe";

		details.appendChild(projectname);
		details.appendChild(projectauth);

		var navbar = document.createElement("div");
		navbar.className = "navbar";
		var navbarbutton = document.createElement("div");
		var navbarimg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg"
		);
		navbarimg.setAttributeNS(null, "class", "wbn");
		navbarimg.setAttributeNS(null, "width", "24");
		navbarimg.setAttributeNS(null, "height", "24");
		navbarimg.setAttributeNS(null, "viewBox", "0 0 24 24");

		var navbarimgpath = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"path"
		);
		navbarimgpath.setAttributeNS(
			null,
			"d",
			"M6 8C6.74028 8 7.38663 7.5978 7.73244 7H14C15.1046 7 16 7.89543 16 9C16 10.1046 15.1046 11 14 11H10C7.79086 11 6 12.7909 6 15C6 17.2091 7.79086 19 10 19H16.2676C16.6134 19.5978 17.2597 20 18 20C19.1046 20 20 19.1046 20 18C20 16.8954 19.1046 16 18 16C17.2597 16 16.6134 16.4022 16.2676 17H10C8.89543 17 8 16.1046 8 15C8 13.8954 8.89543 13 10 13H14C16.2091 13 18 11.2091 18 9C18 6.79086 16.2091 5 14 5H7.73244C7.38663 4.4022 6.74028 4 6 4C4.89543 4 4 4.89543 4 6C4 7.10457 4.89543 8 6 8Z"
		);
		navbarimgpath.setAttributeNS(null, "fill", "#2196F3");
		navbarimgpath.setAttributeNS(null, "transform", "rotate(90 12 12)");
		navbarbutton.className = "navbarbutton";
		navbarimg.appendChild(navbarimgpath);
		navbarbutton.appendChild(navbarimg);
		navbar.appendChild(navbarbutton);

		var navbarcontext = document.createElement("div");
		navbarcontext.className = "navbarcontext";

		var buttondiv = document.createElement("div");
		// buttondiv.className = "buttondiv";

		var theme = document.createElement("div");
		theme.className = "theme";

		var lock = document.createElement("div");
		lock.className = "lock";

		var save = document.createElement("div");
		save.className = "save";

		var load = document.createElement("div");
		load.className = "load";

		var reset = document.createElement("div");
		reset.className = "reset";

		var f = buttondiv.cloneNode(true);
		f.appendChild(theme);
		f.className = "buttondiv themenav";
		navbarcontext.appendChild(f);

		f = buttondiv.cloneNode(true);
		f.appendChild(lock);
		f.className = "buttondiv locknav";
		navbarcontext.appendChild(f);

		f = buttondiv.cloneNode(true);
		f.appendChild(save);
		f.className = "buttondiv savenav";
		navbarcontext.appendChild(f);

		f = buttondiv.cloneNode(true);
		f.appendChild(load);
		f.className = "buttondiv loadnav";
		navbarcontext.appendChild(f);

		f = buttondiv.cloneNode(true);
		f.appendChild(reset);
		f.className = "buttondiv resetnav";
		navbarcontext.appendChild(f);

		navbar.appendChild(navbarcontext);
		navbarbutton.addEventListener("click", function (e) {
			e.stopPropagation();
			navbarcontext.classList.toggle("show");
		});

		control.appendChild(navbar);
		control.appendChild(details);

		this.props.navbar = control;
	}
}
