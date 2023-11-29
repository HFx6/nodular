import React from "react";
import ReactDOM from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import App from "./App.jsx";

import "reactflow/dist/style.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<div style={{ width: "100dvw", height: "100dvh" }}>
			<ReactFlowProvider>
				<App />
			</ReactFlowProvider>
		</div>
	</React.StrictMode>
);
