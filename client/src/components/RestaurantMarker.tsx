import { Marker, Popup } from 'react-leaflet'
import type { Restaurant, Visite } from '../api/types.ts'

export type VisitesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; visites: Visite[] }

interface RestaurantMarkerProps {
  restaurant: Restaurant
  visitesState: VisitesState
  onOpen: (restaurantId: string) => void
}

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return isoDate
  }
  return parsed.toLocaleDateString('fr-FR')
}

function stars(note: number): string {
  const filled = Math.max(0, Math.min(5, note))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function VisitesSection({ visitesState }: { visitesState: VisitesState }) {
  if (visitesState.status === 'idle') {
    return null
  }

  if (visitesState.status === 'loading') {
    return <p className="popup-status">Chargement des visites…</p>
  }

  if (visitesState.status === 'error') {
    return <p className="popup-status popup-error">{visitesState.message}</p>
  }

  const { visites } = visitesState
  if (visites.length === 0) {
    return <p className="popup-status">Aucune visite enregistrée.</p>
  }

  const lastVisite = [...visites].sort((a, b) => b.date.localeCompare(a.date))[0]
  const categories = [...new Set(visites.flatMap((visite) => visite.categories))]
  const photos = visites.flatMap((visite) => visite.urlsPhotos).slice(0, 6)

  return (
    <div className="popup-visites">
      <p className="popup-last-visite">
        <span className="popup-stars" aria-label={`Note ${lastVisite.note} sur 5`}>
          {stars(lastVisite.note)}
        </span>{' '}
        — {formatDate(lastVisite.date)}
      </p>

      {categories.length > 0 && (
        <ul className="popup-categories">
          {categories.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="popup-photos">
          {photos.map((url) => (
            <img key={url} src={url} alt="" loading="lazy" />
          ))}
        </div>
      )}
    </div>
  )
}

function RestaurantMarker({ restaurant, visitesState, onOpen }: RestaurantMarkerProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`

  return (
    <Marker
      position={[restaurant.latitude, restaurant.longitude]}
      eventHandlers={{ click: () => onOpen(restaurant.id) }}
    >
      <Popup>
        <div className="restaurant-popup">
          <h3>{restaurant.nom}</h3>
          <p className="popup-adresse">{restaurant.adresse}</p>

          <VisitesSection visitesState={visitesState} />

          <a
            className="popup-directions"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Itinéraire
          </a>
        </div>
      </Popup>
    </Marker>
  )
}

export default RestaurantMarker
