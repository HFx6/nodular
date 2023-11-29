import { defineConfig } from "vite";
import fs from "fs";
import react from "@vitejs/plugin-react-swc";

const hexLoader = {
	name: "hex-loader",
	transform(code, id) {
		const [path, query] = id.split("?");
		if (query != "raw-hex") return null;

		const data = fs.readFileSync(path);
		const hex = data.toString("hex");

		return `${hex}`;
	},
};

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [hexLoader, react()],
});
