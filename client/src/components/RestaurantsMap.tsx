import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ApiError, getVisites } from '../api/client.ts'
import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import RestaurantMarker from './RestaurantMarker.tsx'
import type { VisitesState } from './RestaurantMarker.tsx'
import type { Theme } from '../hooks/useTheme.ts'
import { useRecommandations } from '../hooks/useRecommandations.ts'
import { averageNote } from '../utils/visites.ts'
import { formatNoteMoyenne, stars } from '../utils/format.ts'
import CategoryBadges from './CategoryBadges.tsx'

const DEFAULT_CENTER: [number, number] = [46.6034, 1.8883] // Centre de la France
const DEFAULT_ZOOM = 6

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

export interface VisiteMutation {
  restaurantId: string
  token: number
}

interface RestaurantsMapProps {
  theme: Theme
  restaurants: Restaurant[]
  visites: Visite[]
  utilisateursAvecFavoris: UtilisateurAvecFavoris[]
  visiteMutation: VisiteMutation | null
  onEditRestaurant: (restaurant: Restaurant) => void
  onEditVisite: (visite: Visite) => void
  onRestaurantDeleted: () => void
  onVisiteDeleted: () => void
}

export interface NoteSummary {
  average: number
  count: number
}

/**
 * Note moyenne + nombre de visites par restaurant, calculés une seule fois pour
 * toute la carte à partir des visites déjà chargées globalement (pas d'appel
 * réseau par marqueur) — remplace l'ancien "dernière visite" affiché sur
 * l'étiquette/la popup, pour rester cohérent avec la vue Liste et la page détail.
 */
function computeNoteSummaries(visites: Visite[]): Map<string, NoteSummary> {
  const visitesParRestaurant = new Map<string, Visite[]>()
  for (const visite of visites) {
    const liste = visitesParRestaurant.get(visite.restaurantId)
    if (liste) {
      liste.push(visite)
    } else {
      visitesParRestaurant.set(visite.restaurantId, [visite])
    }
  }

  const summaries = new Map<string, NoteSummary>()
  for (const [restaurantId, visitesDuRestaurant] of visitesParRestaurant) {
    const average = averageNote(visitesDuRestaurant)
    if (average !== null) {
      summaries.set(restaurantId, { average, count: visitesDuRestaurant.length })
    }
  }
  return summaries
}

function FitBounds({ restaurants }: { restaurants: Restaurant[] }) {
  const map = useMap()

  useEffect(() => {
    if (restaurants.length === 0) {
      return
    }
    if (restaurants.length === 1) {
      map.setView([restaurants[0].latitude, restaurants[0].longitude], 14)
      return
    }
    const bounds = L.latLngBounds(
      restaurants.map((r) => [r.latitude, r.longitude] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [restaurants, map])

  return null
}

/**
 * Recentre la carte et ouvre la popup du marqueur correspondant quand un
 * restaurant est sélectionné depuis la sidebar (Google-Maps style) —
 * s'appuie sur les refs Leaflet des marqueurs collectées par le parent.
 */
function SelectedRestaurantEffect({
  restaurants,
  selectedRestaurantId,
  markersRef,
}: {
  restaurants: Restaurant[]
  selectedRestaurantId: string | null
  markersRef: MutableRefObject<Map<string, L.Marker>>
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedRestaurantId) {
      return
    }
    const restaurant = restaurants.find((r) => r.id === selectedRestaurantId)
    if (!restaurant) {
      return
    }
    // setView (instantané) plutôt que flyTo : l'animation de vol de flyTo charge des tuiles à
    // chaque niveau de zoom intermédiaire pendant le survol, ce qui donnait un déplacement lent et
    // saccadé (surtout mobile/connexion lente) — setView évite complètement cette boucle d'animation.
    map.setView([restaurant.latitude, restaurant.longitude], Math.max(map.getZoom(), 15))
    const marker = markersRef.current.get(selectedRestaurantId)
    marker?.openPopup()
  }, [selectedRestaurantId, restaurants, map, markersRef])

  return null
}

function RestaurantsMap({
  theme,
  restaurants,
  visites,
  utilisateursAvecFavoris,
  visiteMutation,
  onEditRestaurant,
  onEditVisite,
  onRestaurantDeleted,
  onVisiteDeleted,
}: RestaurantsMapProps) {
  const [visitesByRestaurant, setVisitesByRestaurant] = useState<
    Record<string, VisitesState>
  >({})
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  const noteSummaries = useMemo(() => computeNoteSummaries(visites), [visites])

  const recommandations = useRecommandations(restaurants, visites)
  const recommendedIds = useMemo(
    () => new Set(recommandations.map((r) => r.restaurant.id)),
    [recommandations],
  )

  const sortedRestaurants = useMemo(
    () => [...restaurants].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [restaurants],
  )

  const handleMarkerRef = useCallback(
    (restaurantId: string, instance: L.Marker | null) => {
      if (instance) {
        markersRef.current.set(restaurantId, instance)
      } else {
        markersRef.current.delete(restaurantId)
      }
    },
    [],
  )

  function handleSelectRestaurant(restaurantId: string) {
    setSelectedRestaurantId(restaurantId)
    handleOpen(restaurantId)
    setSidebarOpen(false)
  }

  const loadVisites = useCallback((restaurantId: string) => {
    setVisitesByRestaurant((prev) => ({
      ...prev,
      [restaurantId]: { status: 'loading' },
    }))

    getVisites(restaurantId)
      .then((visites) => {
        setVisitesByRestaurant((prev) => ({
          ...prev,
          [restaurantId]: { status: 'loaded', visites },
        }))
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : 'Impossible de charger les visites.'
        setVisitesByRestaurant((prev) => ({
          ...prev,
          [restaurantId]: { status: 'error', message },
        }))
      })
  }, [])

  useEffect(() => {
    if (visiteMutation) {
      loadVisites(visiteMutation.restaurantId)
    }
  }, [visiteMutation, loadVisites])

  function handleOpen(restaurantId: string) {
    const current = visitesByRestaurant[restaurantId]
    if (current && (current.status === 'loading' || current.status === 'loaded')) {
      return
    }

    loadVisites(restaurantId)
  }

  return (
    <div className="map-view">
      <button
        type="button"
        className="map-sidebar-toggle"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        {sidebarOpen ? 'Masquer la liste' : `Voir la liste (${restaurants.length})`}
      </button>

      <aside
        className={
          sidebarOpen ? 'map-sidebar map-sidebar--open' : 'map-sidebar'
        }
      >
        {sortedRestaurants.length === 0 && (
          <p className="list-empty">Aucun restaurant enregistré.</p>
        )}
        <ul className="map-sidebar-list">
          {sortedRestaurants.map((restaurant) => {
            const summary = noteSummaries.get(restaurant.id) ?? null
            const selected = restaurant.id === selectedRestaurantId
            return (
              <li key={restaurant.id}>
                <button
                  type="button"
                  className={
                    selected
                      ? 'map-sidebar-item card card--interactive map-sidebar-item--selected'
                      : 'map-sidebar-item card card--interactive'
                  }
                  onClick={() => handleSelectRestaurant(restaurant.id)}
                >
                  <h3>{restaurant.nom}</h3>
                  <p className="popup-adresse">{restaurant.adresse}</p>
                  {summary && (
                    <p className="list-card-rating">
                      <span className="list-card-rating-value">
                        {formatNoteMoyenne(summary.average)}
                      </span>
                      <span
                        className="popup-stars"
                        aria-label={`Note moyenne ${formatNoteMoyenne(summary.average)} sur 5`}
                      >
                        {stars(Math.round(summary.average))}
                      </span>
                      <span className="list-card-rating-count">
                        ({summary.count} {summary.count > 1 ? 'visites' : 'visite'})
                      </span>
                    </p>
                  )}
                  {restaurant.categories.length > 0 && (
                    <CategoryBadges categories={restaurant.categories} />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="restaurants-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={TILE_URLS[theme]}
          subdomains="abcd"
          maxZoom={20}
          detectRetina
        />
        <FitBounds restaurants={restaurants} />
        <SelectedRestaurantEffect
          restaurants={restaurants}
          selectedRestaurantId={selectedRestaurantId}
          markersRef={markersRef}
        />
        {restaurants.map((restaurant) => (
          <RestaurantMarker
            key={restaurant.id}
            restaurant={restaurant}
            visitesState={visitesByRestaurant[restaurant.id] ?? { status: 'idle' }}
            noteSummary={noteSummaries.get(restaurant.id) ?? null}
            utilisateursAvecFavoris={utilisateursAvecFavoris}
            onOpen={handleOpen}
            onEditRestaurant={onEditRestaurant}
            onEditVisite={onEditVisite}
            onRestaurantDeleted={onRestaurantDeleted}
            onVisitesRefresh={loadVisites}
            onVisiteDeleted={onVisiteDeleted}
            onMarkerRef={handleMarkerRef}
            highlighted={recommendedIds.has(restaurant.id)}
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default RestaurantsMap
