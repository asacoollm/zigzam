import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './saison-jurassic.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SaisonProvider } from './context/SaisonContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SaisonProvider>
          <App />
        </SaisonProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
