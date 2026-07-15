import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadSavedDoc, startAutosave } from './persist/autosave.ts'

// local-first: hydrate the saved doc (if any) before first render, then autosave
void loadSavedDoc().finally(() => {
  startAutosave()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
