import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="flex m-w-100% justify-center">
    <App />
    </div>
  </StrictMode>,
)
