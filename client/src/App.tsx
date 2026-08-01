import { useEffect, useState, useCallback } from 'react'
import { ApiError, getAllVisites, getCategories, getRestaurants } from './api/client.ts'
import type { Categorie, Restaurant, Visite } from './api/types.ts'
import RestaurantsMap from './components/RestaurantsMap.tsx'
import type { VisiteMutation } from './components/RestaurantsMap.tsx'
import RestaurantsList from './components/RestaurantsList.tsx'
import AddRestaurantForm from './components/AddRestaurantForm.tsx'
import AddVisitForm from './components/AddVisitForm.tsx'
import { useTheme } from './hooks/useTheme.ts'
import './App.css'

type Panel = 'none' | 'restaurant' | 'visite'
type View = 'carte' | 'liste'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [visites, setVisites] = useState<Visite[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>('none')
  const [activeView, setActiveView] = useState<View>('carte')
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null,
  )
  const [editingVisite, setEditingVisite] = useState<Visite | null>(null)
  const [visiteMutation, setVisiteMutation] = useState<VisiteMutation | null>(
    null,
  )
  const [preselectedRestaurantId, setPreselectedRestaurantId] = useState<
    string | null
  >(null)

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

  const loadAllVisites = useCallback(async () => {
    try {
      const data = await getAllVisites()
      setVisites(data)
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : 'Impossible de charger les visites.',
      )
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : 'Impossible de charger les catégories.',
      )
    }
  }, [])

  useEffect(() => {
    void loadRestaurants()
    void loadAllVisites()
    void loadCategories()
  }, [loadRestaurants, loadAllVisites, loadCategories])

  useEffect(() => {
    if (visiteMutation) {
      void loadAllVisites()
    }
  }, [visiteMutation, loadAllVisites])

  function closePanel() {
    setActivePanel('none')
    setEditingRestaurant(null)
    setEditingVisite(null)
    setPreselectedRestaurantId(null)
  }

  function handleToggleRestaurantPanel() {
    setActivePanel((panel) =>
      panel === 'restaurant' && editingRestaurant === null ? 'none' : 'restaurant',
    )
    setEditingRestaurant(null)
    setPreselectedRestaurantId(null)
  }

  function handleToggleVisitePanel() {
    setActivePanel((panel) =>
      panel === 'visite' && editingVisite === null ? 'none' : 'visite',
    )
    setEditingVisite(null)
    setPreselectedRestaurantId(null)
  }

  function handleEditRestaurant(restaurant: Restaurant) {
    setEditingVisite(null)
    setEditingRestaurant(restaurant)
    setActivePanel('restaurant')
  }

  function handleEditVisite(visite: Visite) {
    setEditingRestaurant(null)
    setEditingVisite(visite)
    setActivePanel('visite')
  }

  function handleRestaurantDeleted() {
    void loadRestaurants()
    void loadAllVisites()
  }

  function handleRestaurantSaved(restaurantId: string) {
    void loadRestaurants()
    if (editingRestaurant) {
      setActivePanel('none')
      setEditingRestaurant(null)
    } else {
      setActivePanel('visite')
      setPreselectedRestaurantId(restaurantId)
    }
  }

  function handleVisiteSaved(restaurantId: string) {
    setVisiteMutation({ restaurantId, token: Date.now() })
    if (editingVisite) {
      setActivePanel('none')
      setEditingVisite(null)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>RestosVisites</h1>
        <div className="app-view-switch">
          <button
            type="button"
            className={activeView === 'carte' ? 'active' : ''}
            onClick={() => setActiveView('carte')}
          >
            Carte
          </button>
          <button
            type="button"
            className={activeView === 'liste' ? 'active' : ''}
            onClick={() => setActiveView('liste')}
          >
            Liste
          </button>
        </div>
        <div className="app-actions">
          <button
            type="button"
            className={activePanel === 'restaurant' ? 'active' : ''}
            onClick={handleToggleRestaurantPanel}
          >
            + Restaurant
          </button>
          <button
            type="button"
            className={activePanel === 'visite' ? 'active' : ''}
            onClick={handleToggleVisitePanel}
          >
            + Visite
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
            }
            title={
              theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
            }
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeView === 'carte' ? (
          <RestaurantsMap
            theme={theme}
            restaurants={restaurants}
            visites={visites}
            visiteMutation={visiteMutation}
            onEditRestaurant={handleEditRestaurant}
            onEditVisite={handleEditVisite}
            onRestaurantDeleted={handleRestaurantDeleted}
            onVisiteDeleted={() => void loadAllVisites()}
          />
        ) : (
          <RestaurantsList
            restaurants={restaurants}
            visites={visites}
            onEditRestaurant={handleEditRestaurant}
            onRestaurantDeleted={handleRestaurantDeleted}
          />
        )}
        {loadError && <p className="map-error-banner">{loadError}</p>}
      </main>

      {activePanel !== 'none' && (
        <aside className="side-panel">
          <button
            type="button"
            className="side-panel-close"
            aria-label="Fermer"
            onClick={closePanel}
          >
            ×
          </button>
          {activePanel === 'restaurant' && (
            <AddRestaurantForm
              key={editingRestaurant?.id ?? 'new'}
              restaurant={editingRestaurant ?? undefined}
              categories={categories}
              onSaved={handleRestaurantSaved}
            />
          )}
          {activePanel === 'visite' && (
            <AddVisitForm
              key={editingVisite?.id ?? preselectedRestaurantId ?? 'new'}
              restaurants={restaurants}
              visite={editingVisite ?? undefined}
              initialRestaurantId={preselectedRestaurantId ?? undefined}
              onSaved={handleVisiteSaved}
            />
          )}
        </aside>
      )}
    </div>
  )
}

export default App
