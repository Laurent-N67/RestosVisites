import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ApiError, getVisites } from '../api/client.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import RestaurantMarker from './RestaurantMarker.tsx'
import type { VisitesState } from './RestaurantMarker.tsx'

const DEFAULT_CENTER: [number, number] = [46.6034, 1.8883] // Centre de la France
const DEFAULT_ZOOM = 6

export interface VisiteMutation {
  restaurantId: string
  token: number
}

interface RestaurantsMapProps {
  restaurants: Restaurant[]
  visites: Visite[]
  visiteMutation: VisiteMutation | null
  onEditRestaurant: (restaurant: Restaurant) => void
  onEditVisite: (visite: Visite) => void
  onRestaurantDeleted: () => void
  onVisiteDeleted: () => void
}

function computeLastVisites(visites: Visite[]): Map<string, Visite> {
  const lastVisites = new Map<string, Visite>()
  for (const visite of visites) {
    const current = lastVisites.get(visite.restaurantId)
    if (!current || visite.date.localeCompare(current.date) > 0) {
      lastVisites.set(visite.restaurantId, visite)
    }
  }
  return lastVisites
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
  restaurants,
  visites,
  visiteMutation,
  onEditRestaurant,
  onEditVisite,
  onRestaurantDeleted,
  onVisiteDeleted,
}: RestaurantsMapProps) {
  const [visitesByRestaurant, setVisitesByRestaurant] = useState<
    Record<string, VisitesState>
  >({})

  const lastVisites = useMemo(() => computeLastVisites(visites), [visites])

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
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
          lastVisite={lastVisites.get(restaurant.id) ?? null}
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
