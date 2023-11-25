import { useRef, useState, useEffect } from "react";
import MyWorker from "./worker2?worker?inline";
import * as esbuild from "esbuild-wasm";

function App() {
	const [count, setCount] = useState(0);
	const [workerList, setWorkerList] = useState({});
	const [channelList, setChannelList] = useState({});

	const modules = {
		"main.js": `
		import { foo }  from 'foo.js';
		import {bar} from 'bar.js';
		console.log(foo(5), bar(7, 3));
	function Test(){
	return;
	}
	module.exports = {Test}
		`,

		"foo.js": `
		function  foo (x) {
			return x * 2;
		};
	
	module.exports = {foo}
		`,
		
		"bar.js": `
		function bar (a, b) {
			return a + b;
		};
	module.exports = {bar }
		`,
	};
	async function bundle(entry) {
		try {
			const result = await esbuild.build({
				entryPoints: [entry],
				bundle: true,
				format: "iife",
				globalName: "A",
				footer: {
					js: "return A;",
				},

				plugins: [
					{
						name: "in-memory",
						setup(build) {
							build.onResolve({ filter: /.*/ }, (args) => {
								return {
									path: args.path,
									namespace: "in-memory",
								};
							});

							build.onLoad(
								{ filter: /.*/, namespace: "in-memory" },
								(args) => {
									return { contents: modules[args.path] };
								}
							);
						},
					},
				],
			});
			// Log the bundled code
			// console.log(new TextDecoder().decode(result.outputFiles[0].contents));

			// const exports = new Function(
			// 	new TextDecoder().decode(result.outputFiles[0].contents)
			// );
			// console.log(exports());

			return new TextDecoder().decode(result.outputFiles[0].contents);

			// console.log(new TextDecoder().decode(result.outputFiles[0].contents));
		} catch (e) {
			console.error(e);
		}
	}

	useEffect(() => {
		const initialize = async () => {
			await esbuild.initialize({
				wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
			});
			const workers = {};
			const channels = {};
			for (const [name, source] of Object.entries(modules)) {
				const bundledCode = await bundle(name);
				const worker = new MyWorker();
				const channel = new MessageChannel();
				worker.postMessage(
					{
						type: "init",
						module: name,
						code: bundledCode,
					},
					[channel.port2],
					import.meta.url
				);
				channel.port1.onmessage = ({ data }) => {
					worker.postMessage({
						type: "update",
						module: name,
						code: data,
					});
				};

				workers[name] = worker;
				channels[name] = channel;
			}
			setWorkerList(workers);
			setChannelList(channels);
		};

		initialize();
	}, []);

	// console.log(workerList);

	const updateCode = async (name, newCode) => {
		if (workerList[name]) {
			modules[name] = newCode;
			const bundledCode = await bundle(name); // <-- Renamed the constant
			console.log(bundledCode);
			workerList[name].postMessage({
				type: "update",
				module: name,
				code: bundledCode, // <-- Use the renamed constant
			});
		}
	};

	return (
		<>
			<textarea
				style={{ width: "30%", height: "100px" }}
				defaultValue={modules["main.js"]}
				onChange={(e) => {
					modules["main.js"] = e.target.value;
					updateCode("main.js", e.target.value);
				}}
			/>
			<textarea
				style={{ width: "30%", height: "100px" }}
				defaultValue={modules["foo.js"]}
				onChange={(e) => {
					modules["foo.js"] = e.target.value;
					updateCode("foo.js", e.target.value);
				}}
			/>
			<textarea
				style={{ width: "30%", height: "100px" }}
				defaultValue={modules["bar.js"]}
				onChange={(e) => {
					modules["bar.js"] = e.target.value;
					updateCode("bar.js", e.target.value);
				}}
			/>
		</>
	);
}

export default App;
