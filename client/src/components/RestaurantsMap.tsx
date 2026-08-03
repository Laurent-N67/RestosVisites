import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ApiError, getVisites } from '../api/client.ts'
import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import RestaurantMarker from './RestaurantMarker.tsx'
import type { VisitesState } from './RestaurantMarker.tsx'
import type { Theme } from '../hooks/useTheme.ts'
import { averageNote } from '../utils/visites.ts'

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

  const noteSummaries = useMemo(() => computeNoteSummaries(visites), [visites])

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
        />
      ))}
    </MapContainer>
  )
}

export default RestaurantsMap
