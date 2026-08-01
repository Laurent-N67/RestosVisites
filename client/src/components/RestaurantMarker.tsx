import { useState } from 'react'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { deleteVisite, resolvePhotoUrl } from '../api/client.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { errorMessage } from '../utils/errors.ts'
import { formatDate, stars } from '../utils/format.ts'

export type VisitesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; visites: Visite[] }

interface RestaurantMarkerProps {
  restaurant: Restaurant
  visitesState: VisitesState
  lastVisite: Visite | null
  onOpen: (restaurantId: string) => void
  onEditRestaurant: (restaurant: Restaurant) => void
  onRestaurantDeleted: () => void
  onEditVisite: (visite: Visite) => void
  onVisitesRefresh: (restaurantId: string) => void
  onVisiteDeleted: () => void
}

interface VisitesSectionProps {
  visitesState: VisitesState
  onEditVisite: (visite: Visite) => void
  onDeleteVisite: (visite: Visite) => void
  deletingVisiteId: string | null
  visiteError: string | null
}

function VisitesSection({
  visitesState,
  onEditVisite,
  onDeleteVisite,
  deletingVisiteId,
  visiteError,
}: VisitesSectionProps) {
  if (visitesState.status === 'idle') {
    return null
  }

  if (visitesState.status === 'loading') {
    return <p className="popup-status">Chargement des visites…</p>
  }

  if (visitesState.status === 'error') {
    return <p className="popup-status popup-error">{visitesState.message}</p>
  }

  const visites = [...visitesState.visites].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  if (visites.length === 0) {
    return <p className="popup-status">Aucune visite enregistrée.</p>
  }

  return (
    <div className="popup-visites">
      {visiteError && <p className="popup-status popup-error">{visiteError}</p>}
      <ul className="popup-visites-list">
        {visites.map((visite) => (
          <li key={visite.id} className="popup-visite">
            <div className="popup-visite-header">
              <span
                className="popup-stars"
                aria-label={`Note ${visite.note} sur 5`}
              >
                {stars(visite.note)}
              </span>
              <span className="popup-visite-date">{formatDate(visite.date)}</span>
            </div>

            {visite.commentaire && (
              <p className="popup-visite-commentaire">{visite.commentaire}</p>
            )}

            {visite.urlsPhotos.length > 0 && (
              <div className="popup-photos">
                {visite.urlsPhotos.map((url) => (
                  <img
                    key={url}
                    src={resolvePhotoUrl(url)}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <div className="popup-visite-actions">
              <button
                type="button"
                className="popup-btn"
                onClick={() => onEditVisite(visite)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="popup-btn popup-btn-danger"
                disabled={deletingVisiteId === visite.id}
                onClick={() => onDeleteVisite(visite)}
              >
                {deletingVisiteId === visite.id ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RestaurantMarker({
  restaurant,
  visitesState,
  lastVisite,
  onOpen,
  onEditRestaurant,
  onRestaurantDeleted,
  onEditVisite,
  onVisitesRefresh,
  onVisiteDeleted,
}: RestaurantMarkerProps) {
  const {
    deleting: deletingRestaurant,
    error: restaurantError,
    handleDelete: handleDeleteRestaurant,
  } = useDeleteRestaurant(onRestaurantDeleted)
  const [deletingVisiteId, setDeletingVisiteId] = useState<string | null>(null)
  const [visiteError, setVisiteError] = useState<string | null>(null)

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`

  async function handleDeleteVisite(visite: Visite) {
    if (!window.confirm('Supprimer cette visite ?')) {
      return
    }

    setDeletingVisiteId(visite.id)
    setVisiteError(null)
    try {
      await deleteVisite(visite.id)
      onVisitesRefresh(restaurant.id)
      onVisiteDeleted()
    } catch (err) {
      setVisiteError(errorMessage(err, 'La suppression de la visite a échoué.'))
    } finally {
      setDeletingVisiteId(null)
    }
  }

  return (
    <Marker
      position={[restaurant.latitude, restaurant.longitude]}
      eventHandlers={{ click: () => onOpen(restaurant.id) }}
    >
      <Tooltip permanent direction="top" offset={[0, -41]} className="restaurant-label">
        <span className="restaurant-label-nom">{restaurant.nom}</span>
        {lastVisite && (
          <span
            className="restaurant-label-note"
            aria-label={`Note ${lastVisite.note} sur 5`}
          >
            {stars(lastVisite.note)}
          </span>
        )}
      </Tooltip>
      <Popup>
        <div className="restaurant-popup">
          <div className="popup-header">
            <h3>{restaurant.nom}</h3>
            <div className="popup-actions">
              <button
                type="button"
                className="popup-btn"
                onClick={() => onEditRestaurant(restaurant)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="popup-btn popup-btn-danger"
                disabled={deletingRestaurant}
                onClick={() => void handleDeleteRestaurant(restaurant)}
              >
                {deletingRestaurant ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>

          <p className="popup-adresse">{restaurant.adresse}</p>
          {restaurant.categories.length > 0 && (
            <ul className="popup-categories">
              {restaurant.categories.map((categorie) => (
                <li key={categorie.id}>{categorie.nom}</li>
              ))}
            </ul>
          )}
          {restaurantError && (
            <p className="popup-status popup-error">{restaurantError}</p>
          )}

          <VisitesSection
            visitesState={visitesState}
            onEditVisite={onEditVisite}
            onDeleteVisite={(visite) => void handleDeleteVisite(visite)}
            deletingVisiteId={deletingVisiteId}
            visiteError={visiteError}
          />

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
