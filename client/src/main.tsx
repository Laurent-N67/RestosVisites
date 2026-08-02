import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './leaflet-icon-fix.ts'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { FavorisProvider } from './contexts/FavorisContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavorisProvider>
          <App />
        </FavorisProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
