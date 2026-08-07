import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { resolvePhotoUrl } from '../api/client.ts'
import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { formatDate, stars } from '../utils/format.ts'
import { averageNote, estFavoriDeUtilisateur } from '../utils/visites.ts'
import PhotoLightbox from './PhotoLightbox.tsx'
import RestaurantDetailCard from './RestaurantDetailCard.tsx'

interface RestaurantDetailPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
  utilisateursAvecFavoris: UtilisateurAvecFavoris[]
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
  utilisateursAvecFavoris,
  onEditRestaurant,
  onEditVisite,
  onRestaurantDeleted,
  onVisiteDeleted,
}: RestaurantDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin

  function handleBack() {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

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
        <button type="button" className="detail-back-link" onClick={handleBack}>
          ← Retour
        </button>
      </div>
    )
  }

  const restaurantVisites = visites
    .filter((visite) => visite.restaurantId === restaurant.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const restaurantAverageNote = averageNote(restaurantVisites)

  return (
    <div className="detail-page">
      <button type="button" className="detail-back-link" onClick={handleBack}>
        ← Retour
      </button>

      <RestaurantDetailCard
        restaurant={restaurant}
        averageNote={restaurantAverageNote}
        visitesCount={restaurantVisites.length}
        isFavori={isFavori}
        favoriDisabled={favoriLoading || favoriPending}
        onToggleFavori={() => void toggleFavori()}
        isAdmin={isAdmin}
        onEdit={() => onEditRestaurant(restaurant)}
        onDelete={() => void handleDeleteRestaurant(restaurant)}
        deleting={deletingRestaurant}
      />
      {restaurantError && (
        <p className="popup-status popup-error">{restaurantError}</p>
      )}
      {favoriError && <p className="popup-status popup-error">{favoriError}</p>}

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
                {estFavoriDeUtilisateur(
                  utilisateursAvecFavoris,
                  visite.utilisateurId,
                  restaurant.id,
                ) && <span className="popup-favori-badge">★ Restaurant favori !</span>}
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
