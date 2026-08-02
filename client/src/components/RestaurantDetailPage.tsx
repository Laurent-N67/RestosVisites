import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resolvePhotoUrl } from '../api/client.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { formatDate, stars } from '../utils/format.ts'
import PhotoLightbox from './PhotoLightbox.tsx'

interface RestaurantDetailPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
  onEditRestaurant: (restaurant: Restaurant) => void
  onEditVisite: (visite: Visite) => void
  onRestaurantDeleted: () => void
  onVisiteDeleted: () => void
}

interface LightboxState {
  photos: string[]
  index: number
}

function RestaurantDetailPage({
  restaurants,
  visites,
  onEditRestaurant,
  onEditVisite,
  onRestaurantDeleted,
  onVisiteDeleted,
}: RestaurantDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin

  const restaurant = restaurants.find((r) => r.id === id) ?? null

  const {
    deleting: deletingRestaurant,
    error: restaurantError,
    handleDelete: handleDeleteRestaurant,
  } = useDeleteRestaurant(() => {
    onRestaurantDeleted()
    navigate('/')
  })

  const {
    deletingId: deletingVisiteId,
    error: visiteError,
    handleDelete: handleDeleteVisite,
  } = useDeleteVisite(onVisiteDeleted)

  const {
    isFavori,
    loading: favoriLoading,
    pending: favoriPending,
    error: favoriError,
    toggle: toggleFavori,
  } = useFavoriToggle(id ?? '')

  if (!restaurant) {
    return (
      <div className="detail-page">
        <p className="popup-status popup-error">Restaurant introuvable.</p>
        <Link to="/" className="detail-back-link">
          ← Retour à la carte
        </Link>
      </div>
    )
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`

  const restaurantVisites = visites
    .filter((visite) => visite.restaurantId === restaurant.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="detail-page">
      <Link to="/" className="detail-back-link">
        ← Retour à la carte
      </Link>

      <div className="popup-header detail-header">
        <h2>{restaurant.nom}</h2>
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
      {favoriError && <p className="popup-status popup-error">{favoriError}</p>}

      <a
        className="popup-directions"
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Itinéraire
      </a>

      <h3 className="detail-visites-title">Historique des visites</h3>
      {visiteError && <p className="popup-status popup-error">{visiteError}</p>}

      {restaurantVisites.length === 0 ? (
        <p className="popup-status">Aucune visite enregistrée.</p>
      ) : (
        <ul className="popup-visites-list detail-visites-list">
          {restaurantVisites.map((visite) => (
            <li key={visite.id} className="popup-visite">
              <div className="popup-visite-header">
                <span
                  className="popup-stars"
                  aria-label={`Note ${visite.note} sur 5`}
                >
                  {stars(visite.note)}
                </span>
                <span className="popup-visite-date">
                  {formatDate(visite.date)}
                </span>
              </div>
              <p className="popup-visite-auteur">
                Visité par {visite.utilisateurNomAffiche}
              </p>

              {visite.commentaire && (
                <p className="popup-visite-commentaire">{visite.commentaire}</p>
              )}

              {visite.urlsPhotos.length > 0 && (
                <div className="popup-photos">
                  {visite.urlsPhotos.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      className="detail-photo-thumb"
                      onClick={() =>
                        setLightbox({
                          photos: visite.urlsPhotos.map(resolvePhotoUrl),
                          index,
                        })
                      }
                    >
                      <img src={resolvePhotoUrl(url)} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              {(isAdmin || user?.id === visite.utilisateurId) && (
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
                    onClick={() => void handleDeleteVisite(visite)}
                  >
                    {deletingVisiteId === visite.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

export default RestaurantDetailPage
