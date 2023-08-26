function evalNodeJavascript(nodeIns) {
	const args = nodeIns.map((_subnode) => {
		return (
			_subnode.data.funceval ??
			new Function(
				`return function ${_subnode.data.func.replace("function", "")}`
			)()()
		);
	});
}

async function evalNodePython() {
	const output = await ato_run(args, lang, code);
	console.log("Final Output:", output);
}

function evalNode(node) {
	switch (node.data.lang) {
		case "python3":
			return evalNodePython(node);
		case "node":
			return evalNodeJavascript(node);
		default:
			return node;
	}
}

function evalgraph(node, nodes, edges, updateLoadingCallback) {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const nodeIns = getIncomers(node, nodes, edges);
		const dependmet = node.data.args.length === nodeIns.length;

		if (!dependmet) {
			resolve(nodes);
			return;
		}

		try {
			const args = nodeIns.map((_subnode) => {
				return (
					_subnode.data.funceval ??
					new Function(
						`return function ${_subnode.data.func.replace(
							"function",
							""
						)}`
					)()()
				);
			});

			if (node.data.hasfunc) {
				// console.log(node.id);
				updateLoadingCallback(node.id, true);
				node.data.funceval = new Function(
					`return function ${node.data.func.replace("function", "")}`
				)()(...args);
				setTimeout(() => {
					updateLoadingCallback(node.id, false);
				}, 300);
			}

			const nodeOuts = getOutgoers(node, nodes, edges);
			const promises = nodeOuts.map((_subnode) =>
				evalgraph(_subnode, edges, nodes)
			);

			Promise.all(promises)
				.then(() => {
					const endTime = Date.now();
					const timeTaken = endTime - startTime;
					resolve({ nodes, timeTaken });
				})
				.catch((err) => {
					reject(err);
				});
		} catch (err) {
			console.error("Error during evaluation:", err);
			reject(err);
		}
	});
}
