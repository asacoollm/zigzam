import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './saison-jurassic.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SaisonProvider } from './context/SaisonContext.jsx'
import { CallProvider } from './context/CallContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SaisonProvider>
          <CallProvider>
            <App />
          </CallProvider>
        </SaisonProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
