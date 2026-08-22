import { useEffect, useState, useCallback } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ApiError,
  getAllVisites,
  getCategories,
  getRestaurants,
  getUtilisateursAvecFavoris,
} from './api/client.ts'
import type { Categorie, Restaurant, UtilisateurAvecFavoris, Visite } from './api/types.ts'
import RestaurantsMap from './components/RestaurantsMap.tsx'
import type { VisiteMutation } from './components/RestaurantsMap.tsx'
import RestaurantsList from './components/RestaurantsList.tsx'
import RestaurantDetailPage from './components/RestaurantDetailPage.tsx'
import AddRestaurantForm from './components/AddRestaurantForm.tsx'
import AddVisitForm from './components/AddVisitForm.tsx'
import AuthPage from './components/AuthPage.tsx'
import MesVisitesPage from './components/MesVisitesPage.tsx'
import UtilisateursPage from './components/UtilisateursPage.tsx'
import StatsPage from './components/StatsPage.tsx'
import ProfilPage from './components/ProfilPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import RestaurantSearch from './components/RestaurantSearch.tsx'
import UserMenu from './components/UserMenu.tsx'
import BottomNav from './components/BottomNav.tsx'
import { BellIcon, ChecklistIcon, HistoryIcon, MapIcon, PinIcon, UsersIcon } from './components/icons/Icons.tsx'
import { useAuth } from './contexts/AuthContext.tsx'
import { useTheme } from './hooks/useTheme.ts'
import './App.css'

type Panel = 'none' | 'restaurant' | 'visite'

const NAV_ITEMS = [
  { to: '/', label: 'Carte', icon: MapIcon, match: (path: string) => path === '/' },
  { to: '/liste', label: 'Restaurants', icon: ChecklistIcon, match: (path: string) => path === '/liste' },
  { to: '/visites', label: 'Visites', icon: HistoryIcon, match: (path: string) => path.startsWith('/visites') },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: UsersIcon, match: (path: string) => path.startsWith('/utilisateurs') },
] as const

function App() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [visites, setVisites] = useState<Visite[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [utilisateursAvecFavoris, setUtilisateursAvecFavoris] = useState<
    UtilisateurAvecFavoris[]
  >([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>('none')
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
  const [addMenuOpen, setAddMenuOpen] = useState(false)

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

  const loadUtilisateursAvecFavoris = useCallback(async () => {
    try {
      const data = await getUtilisateursAvecFavoris()
      setUtilisateursAvecFavoris(data)
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : 'Impossible de charger les utilisateurs.',
      )
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setRestaurants([])
      setVisites([])
      setCategories([])
      setUtilisateursAvecFavoris([])
      setLoadError(null)
      return
    }
    void loadRestaurants()
    void loadAllVisites()
    void loadCategories()
    void loadUtilisateursAvecFavoris()
  }, [
    user,
    loadRestaurants,
    loadAllVisites,
    loadCategories,
    loadUtilisateursAvecFavoris,
  ])

  useEffect(() => {
    if (visiteMutation) {
      void loadAllVisites()
    }
  }, [visiteMutation, loadAllVisites])

  useEffect(() => {
    setActivePanel('none')
    setEditingRestaurant(null)
    setEditingVisite(null)
    setPreselectedRestaurantId(null)
  }, [location.pathname])

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

  function handleAddVisiteForRestaurant(restaurantId: string) {
    setActivePanel('visite')
    setPreselectedRestaurantId(restaurantId)
  }

  function handleRestaurantSaved(restaurantId: string) {
    void loadRestaurants()
    if (editingRestaurant) {
      setActivePanel('none')
      setEditingRestaurant(null)
    } else {
      handleAddVisiteForRestaurant(restaurantId)
    }
  }

  function handleVisiteSaved(restaurantId: string) {
    setVisiteMutation({ restaurantId, token: Date.now() })
    if (editingVisite) {
      setActivePanel('none')
      setEditingVisite(null)
    }
  }

  async function handleLogout() {
    closePanel()
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>
          <PinIcon className="app-logo-icon" aria-hidden="true" />
          RestosVisites
        </h1>
        {user && (
          <nav className="app-nav">
            {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => (
              <Link
                key={to}
                to={to}
                className={match(location.pathname) ? 'active' : ''}
              >
                <Icon aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="app-actions">
          {user && <RestaurantSearch restaurants={restaurants} />}
          <div className="theme-toggle" role="group" aria-label="Thème">
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              onClick={() => setTheme('light')}
              aria-label="Mode clair"
              title="Mode clair"
            >
              ☀️
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => setTheme('dark')}
              aria-label="Mode sombre"
              title="Mode sombre"
            >
              🌙
            </button>
          </div>
          {user && (
            <div className="header-add">
              <button
                type="button"
                className="header-add-trigger"
                aria-expanded={addMenuOpen}
                aria-label="Ajouter un restaurant ou une visite"
                onClick={() => setAddMenuOpen((value) => !value)}
              >
                <span className="header-add-trigger-text">+ Ajouter</span>
                <span className="header-add-trigger-icon" aria-hidden="true">
                  +
                </span>
              </button>
              {addMenuOpen && (
                <div className="header-add-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleVisitePanel()
                      setAddMenuOpen(false)
                    }}
                  >
                    + Visite
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleRestaurantPanel()
                      setAddMenuOpen(false)
                    }}
                  >
                    + Restaurant
                  </button>
                </div>
              )}
            </div>
          )}
          {user && (
            <button
              type="button"
              className="header-bell"
              disabled
              aria-label="Notifications (à venir)"
              title="Notifications (à venir)"
            >
              <BellIcon aria-hidden="true" />
            </button>
          )}
          {user && (
            <UserMenu
              user={user}
              theme={theme}
              onSetTheme={setTheme}
              onLogout={() => void handleLogout()}
            />
          )}
        </div>
      </header>

      {user && <BottomNav />}

      <div className="app-body">
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RestaurantsMap
                    theme={theme}
                    restaurants={restaurants}
                    visites={visites}
                    utilisateursAvecFavoris={utilisateursAvecFavoris}
                    visiteMutation={visiteMutation}
                    onEditRestaurant={handleEditRestaurant}
                    onEditVisite={handleEditVisite}
                    onRestaurantDeleted={handleRestaurantDeleted}
                    onVisiteDeleted={() => void loadAllVisites()}
                    onAddVisite={handleAddVisiteForRestaurant}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/liste"
              element={
                <ProtectedRoute>
                  <RestaurantsList restaurants={restaurants} visites={visites} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurants/:id"
              element={
                <ProtectedRoute>
                  <RestaurantDetailPage
                    restaurants={restaurants}
                    visites={visites}
                    utilisateursAvecFavoris={utilisateursAvecFavoris}
                    onEditRestaurant={handleEditRestaurant}
                    onEditVisite={handleEditVisite}
                    onRestaurantDeleted={handleRestaurantDeleted}
                    onVisiteDeleted={() => void loadAllVisites()}
                    onAddVisite={handleAddVisiteForRestaurant}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visites"
              element={
                <ProtectedRoute>
                  <MesVisitesPage
                    restaurants={restaurants}
                    visites={visites}
                    onEditVisite={handleEditVisite}
                    onVisiteDeleted={() => void loadAllVisites()}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/utilisateurs"
              element={
                <ProtectedRoute>
                  <UtilisateursPage visites={visites} />
                </ProtectedRoute>
              }
            />
            <Route path="/mon-compte" element={<Navigate to="/profil" replace />} />
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <ProfilPage visites={visites} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute requireAdmin>
                  <StatsPage
                    restaurants={restaurants}
                    visites={visites}
                    categories={categories}
                    utilisateursAvecFavoris={utilisateursAvecFavoris}
                    theme={theme}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
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
    </div>
  )
}

export default App
