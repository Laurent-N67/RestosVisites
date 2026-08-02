import { Link } from 'react-router-dom'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { resolvePhotoUrl } from '../api/client.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
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
  currentUserId: string | undefined
  isAdmin: boolean
}

function VisitesSection({
  visitesState,
  onEditVisite,
  onDeleteVisite,
  deletingVisiteId,
  visiteError,
  currentUserId,
  isAdmin,
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
            <p className="popup-visite-auteur">
              Visité par {visite.utilisateurNomAffiche}
            </p>

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

            {(isAdmin || currentUserId === visite.utilisateurId) && (
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
            )}
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
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin
  const {
    deleting: deletingRestaurant,
    error: restaurantError,
    handleDelete: handleDeleteRestaurant,
  } = useDeleteRestaurant(onRestaurantDeleted)
  const {
    deletingId: deletingVisiteId,
    error: visiteError,
    handleDelete: handleDeleteVisite,
  } = useDeleteVisite((restaurantId) => {
    onVisitesRefresh(restaurantId)
    onVisiteDeleted()
  })
  const {
    isFavori,
    loading: favoriLoading,
    pending: favoriPending,
    error: favoriError,
    toggle: toggleFavori,
  } = useFavoriToggle(restaurant.id)

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`

  return (
    <Marker
      position={[restaurant.latitude, restaurant.longitude]}
      eventHandlers={{ click: () => onOpen(restaurant.id) }}
    >
      <Tooltip permanent direction="top" offset={[-16, -17]} className="restaurant-label">
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
            {user && (
              <div className="popup-actions">
                <button
                  type="button"
                  className={isFavori ? 'popup-btn popup-btn-favori-active' : 'popup-btn'}
                  disabled={favoriLoading || favoriPending}
                  onClick={() => void toggleFavori()}
                >
                  {isFavori ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
                </button>
                {isAdmin && (
                  <>
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
                  </>
                )}
              </div>
            )}
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
          {favoriError && (
            <p className="popup-status popup-error">{favoriError}</p>
          )}

          <VisitesSection
            visitesState={visitesState}
            onEditVisite={onEditVisite}
            onDeleteVisite={(visite) => void handleDeleteVisite(visite)}
            deletingVisiteId={deletingVisiteId}
            visiteError={visiteError}
            currentUserId={user?.id}
            isAdmin={isAdmin}
          />

          <div className="popup-links">
            <a
              className="popup-directions"
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Itinéraire
            </a>
            <Link
              className="popup-directions"
              to={`/restaurants/${restaurant.id}`}
            >
              Voir toutes les visites
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default RestaurantMarker
