import { useEffect, useState, useCallback } from 'react'
import { ApiError, getRestaurants } from './api/client.ts'
import type { Restaurant } from './api/types.ts'
import RestaurantsMap from './components/RestaurantsMap.tsx'
import AddRestaurantForm from './components/AddRestaurantForm.tsx'
import AddVisitForm from './components/AddVisitForm.tsx'
import './App.css'

type Panel = 'none' | 'restaurant' | 'visite'

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>('none')
  const [refreshToken, setRefreshToken] = useState(0)

  const loadRestaurants = useCallback(async () => {
    try {
      const data = await getRestaurants()
      setRestaurants(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : 'Impossible de charger les restaurants.',
      )
    }
  }, [])

  useEffect(() => {
    void loadRestaurants()
  }, [loadRestaurants])

  function handleRestaurantCreated() {
    void loadRestaurants()
  }

  function handleVisiteCreated() {
    setRefreshToken((token) => token + 1)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>RestosVisites</h1>
        <div className="app-actions">
          <button
            type="button"
            className={activePanel === 'restaurant' ? 'active' : ''}
            onClick={() =>
              setActivePanel((panel) =>
                panel === 'restaurant' ? 'none' : 'restaurant',
              )
            }
          >
            + Restaurant
          </button>
          <button
            type="button"
            className={activePanel === 'visite' ? 'active' : ''}
            onClick={() =>
              setActivePanel((panel) => (panel === 'visite' ? 'none' : 'visite'))
            }
          >
            + Visite
          </button>
        </div>
      </header>

      <main className="app-main">
        <RestaurantsMap restaurants={restaurants} refreshToken={refreshToken} />
        {loadError && <p className="map-error-banner">{loadError}</p>}
      </main>

      {activePanel !== 'none' && (
        <aside className="side-panel">
          <button
            type="button"
            className="side-panel-close"
            aria-label="Fermer"
            onClick={() => setActivePanel('none')}
          >
            ×
          </button>
          {activePanel === 'restaurant' && (
            <AddRestaurantForm onCreated={handleRestaurantCreated} />
          )}
          {activePanel === 'visite' && (
            <AddVisitForm restaurants={restaurants} onCreated={handleVisiteCreated} />
          )}
        </aside>
      )}
    </div>
  )
}

export default App
