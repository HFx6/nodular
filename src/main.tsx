import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { loadSavedDoc, startAutosave } from "./persist/autosave.ts";
import { bootEngine } from "./engine/boot.ts";

// local-first: hydrate the saved doc (if any) before first render, then boot
// the engine (adapters registered, whole graph marked dirty) and autosave
void loadSavedDoc().finally(() => {
  bootEngine();
  startAutosave();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
