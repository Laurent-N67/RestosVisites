import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './leaflet-icon-fix.ts'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { FavorisProvider } from './contexts/FavorisContext.tsx'

// Le service worker (registerType: 'autoUpdate') active une nouvelle version en tâche de fond
// dès qu'elle est détectée, mais l'onglet déjà ouvert continue d'exécuter l'ancien JS/CSS chargé
// en mémoire tant qu'il n'est pas rechargé — sans ce listener, une session PWA restée ouverte
// (ou une appli installée jamais fermée) peut afficher indéfiniment une version périmée malgré
// des déploiements réguliers. 'controllerchange' se déclenche exactement quand le nouveau service
// worker prend le contrôle : un seul rechargement automatique à ce moment-là suffit.
if ('serviceWorker' in navigator) {
  let dejaRecharge = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (dejaRecharge) {
      return
    }
    dejaRecharge = true
    window.location.reload()
  })
}

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
