// src/nodes/language_nodes/CanvasNode.jsx
import React from "react";
import CodeNode from "./CodeNode";
import { FaNodeJs } from "react-icons/fa";
import useLuaWorker from '../../utils/wasm/lua/useLuaWorker';

function CanvasNode({ data, id }) {
  const { ready, runLua, worker } = useLuaWorker();

  const playFromNode = (id) => {
    console.log(id);
  };

  return (
    <>
      <CodeNode
        icon={<FaNodeJs />}
        name={"isinarray()"}
        data={data}
        id={id}
        playCallback={() => playFromNode(id)}
      />
      <div className="header-gradient"></div>
      <div id="text-fields" style={{height: "300px"}}>
        <textarea id="output" style={{flex: "auto"}} readOnly></textarea>
      </div>
      
      <button onClick={runLua} disabled={!ready}>run</button>
      <button onClick={() => worker.postMessage({ command: 'lua_stop' })}>stop</button>
      <button onClick={() => document.getElementById('editor').value = ''}>clear</button>
      <button onClick={() => worker.postMessage({ command: 'saveToFile' })}>save</button>
      <select onChange={(e) => worker.postMessage({ command: 'loadExample', value: e.target.value })} value="">
        <option value="">load example...</option>
        <option value="hello.lua">hello</option>
        <option value="globals.lua">globals</option>
        <option value="bisect.lua">bisect</option>
        <option value="sieve.lua">sieve</option>
        <option value="account.lua">account</option>
        <option value="controller.lua">cube controller</option>
        <option value="cps.lua">clicks per second</option>
        <option value="mandelbrot.lua">mandelbrot</option>
        <option value="conway.lua">conway</option>
      </select>
      <br />
      <p>canvas:</p>
      <canvas id="canvas" width="650" height="488"></canvas>
    </>
  );
}

export default CanvasNode;