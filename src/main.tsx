import { MathfieldElement } from 'mathlive'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

MathfieldElement.fontsDirectory = '/mathlive/fonts'
MathfieldElement.soundsDirectory = '/mathlive/sounds'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
