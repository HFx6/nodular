import Enviroment from "./components/Enviroment";
import "./App.css";

import Toaster from "./components/Toast";

function App() {
	return (
		<>
			<div>
				<Toaster position="bottom-right" reverseOrder={true} />
			</div>
			<Enviroment />
		</>
	);
}

export default App;
