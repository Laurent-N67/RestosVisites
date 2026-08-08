import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import L from 'leaflet'
import { ApiError, getVisites } from '../api/client.ts'
import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import RestaurantMarker from './RestaurantMarker.tsx'
import type { VisitesState } from './RestaurantMarker.tsx'
import RestaurantDetailPanel from './RestaurantDetailPanel.tsx'
import type { Theme } from '../hooks/useTheme.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useRecommandations } from '../hooks/useRecommandations.ts'
import { averageNote, buildJournal } from '../utils/visites.ts'
import type { JournalEntry } from '../utils/visites.ts'
import { formatNoteMoyenne, stars } from '../utils/format.ts'
import CategoryBadges from './CategoryBadges.tsx'
import CoverPhoto from './CoverPhoto.tsx'
import FavorisSlots from './FavorisSlots.tsx'
import RecommendationCard from './RecommendationCard.tsx'

const RECENT_VISITS_LIMIT = 6
const RECOMMANDATIONS_SECTION_LIMIT = 4

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
  onAddVisite: (restaurantId: string) => void
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

/**
 * Photo de couverture d'une entrée de journal, avec la même chaîne de repli
 * que `JournalCard` (photo de la visite elle-même → photo principale/première
 * photo du restaurant → placeholder de `CoverPhoto`) — dupliquée ici plutôt
 * qu'importée car la ligne compacte "Visites récentes" de la page Carte
 * n'a pas besoin du reste du rendu (étoiles pleine taille, actions
 * modifier/supprimer, etc.) de `JournalCard`.
 */
function recentVisitCoverUrl(entry: JournalEntry): string | undefined {
  return (
    entry.visite.urlsPhotos[0] ??
    entry.restaurant.photos.find((photo) => photo.estPrincipale)?.url ??
    entry.restaurant.photos[0]?.url
  )
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
 * Recentre la carte quand un restaurant est sélectionné depuis la sidebar,
 * un marqueur, ou le panneau de détail (Google-Maps style).
 */
function SelectedRestaurantEffect({
  restaurants,
  selectedRestaurantId,
  markersRef,
  clusterGroupRef,
}: {
  restaurants: Restaurant[]
  selectedRestaurantId: string | null
  markersRef: React.RefObject<Map<string, L.Marker>>
  clusterGroupRef: React.RefObject<React.ComponentRef<typeof MarkerClusterGroup> | null>
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
    const target: [number, number] = [restaurant.latitude, restaurant.longitude]
    // setView (instantané) plutôt que flyTo : l'animation de vol de flyTo charge des tuiles à
    // chaque niveau de zoom intermédiaire pendant le survol, ce qui donnait un déplacement lent et
    // saccadé (surtout mobile/connexion lente) — setView évite complètement cette boucle d'animation.
    const recenter = () => map.setView(target, Math.max(map.getZoom(), 15))

    const marker = markersRef.current.get(restaurant.id)
    const clusterGroup = clusterGroupRef.current
    if (marker && clusterGroup) {
      // Le marqueur peut être masqué dans une bulle de cluster à ce niveau de
      // zoom : zoomToShowLayer (API de Leaflet.markercluster, exposée par le
      // ref de MarkerClusterGroup) zoome/spiderfie jusqu'à ce qu'il devienne
      // visible individuellement, puis recentre exactement dessus une fois
      // révélé — un simple setView ne suffirait pas à faire éclater le
      // cluster.
      clusterGroup.zoomToShowLayer(marker, recenter)
    } else {
      recenter()
    }
  }, [selectedRestaurantId, restaurants, map, markersRef, clusterGroupRef])

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
  onAddVisite,
}: RestaurantsMapProps) {
  const [visitesByRestaurant, setVisitesByRestaurant] = useState<
    Record<string, VisitesState>
  >({})
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const clusterGroupRef = useRef<React.ComponentRef<
    typeof MarkerClusterGroup
  > | null>(null)

  const { user } = useAuth()

  const noteSummaries = useMemo(() => computeNoteSummaries(visites), [visites])

  const recommandations = useRecommandations(restaurants, visites)
  const recommendedIds = useMemo(
    () => new Set(recommandations.map((r) => r.restaurant.id)),
    [recommandations],
  )
  // Section "Recommandés pour vous" : mêmes recommandations, mais avec une
  // limite plus généreuse que le highlighting des marqueurs ci-dessus (2),
  // pour remplir une grille plutôt que quelques pastilles sur la carte.
  const recommandationsSection = useRecommandations(
    restaurants,
    visites,
    RECOMMANDATIONS_SECTION_LIMIT,
  )

  const journalEntries = useMemo(
    () => (user ? buildJournal(restaurants, visites, user.id) : []),
    [restaurants, visites, user],
  )
  const recentJournalEntries = journalEntries.slice(0, RECENT_VISITS_LIMIT)

  const sortedRestaurants = useMemo(
    () => [...restaurants].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [restaurants],
  )

  const selectedRestaurant =
    restaurants.find((r) => r.id === selectedRestaurantId) ?? null

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
    <div className="map-page">
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
              const photoPrincipale =
                restaurant.photos.find((photo) => photo.estPrincipale) ??
                restaurant.photos[0]
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
                    <div className="map-sidebar-item-thumb">
                      <CoverPhoto url={photoPrincipale?.url} alt={restaurant.nom} />
                    </div>
                    <div className="map-sidebar-item-body">
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
                    </div>
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
            clusterGroupRef={clusterGroupRef}
          />
          <MarkerClusterGroup ref={clusterGroupRef} spiderfyOnMaxZoom showCoverageOnHover={false}>
            {restaurants.map((restaurant) => (
              <RestaurantMarker
                key={restaurant.id}
                restaurant={restaurant}
                noteSummary={noteSummaries.get(restaurant.id) ?? null}
                onSelect={handleSelectRestaurant}
                onMarkerRef={handleMarkerRef}
                highlighted={recommendedIds.has(restaurant.id)}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {selectedRestaurant && (
          <RestaurantDetailPanel
            key={selectedRestaurant.id}
            restaurant={selectedRestaurant}
            visitesState={visitesByRestaurant[selectedRestaurant.id] ?? { status: 'idle' }}
            utilisateursAvecFavoris={utilisateursAvecFavoris}
            onClose={() => setSelectedRestaurantId(null)}
            onEditRestaurant={onEditRestaurant}
            onRestaurantDeleted={onRestaurantDeleted}
            onEditVisite={onEditVisite}
            onVisitesRefresh={loadVisites}
            onVisiteDeleted={onVisiteDeleted}
            onAddVisite={onAddVisite}
          />
        )}
      </div>

      <div className="map-page-sections">
        {recentJournalEntries.length > 0 && (
          <section className="map-section">
            <div className="map-section-header">
              <h3>Visites récentes</h3>
              {journalEntries.length > RECENT_VISITS_LIMIT && (
                <Link to="/visites" className="map-section-link">
                  Voir tout
                </Link>
              )}
            </div>
            <div className="map-recent-visits-list">
              {recentJournalEntries.map((entry) => (
                <Link
                  key={entry.visite.id}
                  to={`/restaurants/${entry.restaurant.id}`}
                  className="map-recent-visit-row"
                >
                  <div className="map-recent-visit-thumb">
                    <CoverPhoto
                      url={recentVisitCoverUrl(entry)}
                      alt={entry.restaurant.nom}
                    />
                  </div>
                  <div className="map-recent-visit-body">
                    <span className="map-recent-visit-name">
                      {entry.restaurant.nom}
                    </span>
                    <span
                      className="popup-stars map-recent-visit-rating"
                      aria-label={`Note ${entry.visite.note} sur 5`}
                    >
                      {stars(entry.visite.note)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="map-section map-section--favoris">
          <h3>Favoris</h3>
          <FavorisSlots restaurants={restaurants} />
        </section>

        {recommandationsSection.length > 0 && (
          <section className="map-section">
            <h3>Recommandés pour vous</h3>
            <div className="map-recommendations-row">
              {recommandationsSection.map((recommandation) => (
                <RecommendationCard
                  key={recommandation.restaurant.id}
                  recommandation={recommandation}
                  visites={visites}
                  compact
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default RestaurantsMap
