import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position="top-center" toastOptions={{ style: { background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155' } }} />
    <App />
  </StrictMode>,
)
