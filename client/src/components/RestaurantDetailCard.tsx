import type { Restaurant } from '../api/types.ts'
import { formatNoteMoyenne, stars } from '../utils/format.ts'
import CategoryBadges from './CategoryBadges.tsx'
import CoverPhoto from './CoverPhoto.tsx'

interface RestaurantDetailCardProps {
  restaurant: Restaurant
  averageNote: number | null
  visitesCount: number
  isFavori: boolean
  favoriDisabled: boolean
  onToggleFavori: () => void
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}

function RestaurantDetailCard({
  restaurant,
  averageNote,
  visitesCount,
  isFavori,
  favoriDisabled,
  onToggleFavori,
  isAdmin,
  onEdit,
  onDelete,
  deleting,
}: RestaurantDetailCardProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`

  const photoPrincipale =
    restaurant.photos.find((photo) => photo.estPrincipale) ?? restaurant.photos[0]

  return (
    <div className="restaurant-detail-card">
      <div className="detail-cover-photo">
        <CoverPhoto url={photoPrincipale?.url} alt={restaurant.nom} />
      </div>

      <div className="popup-header detail-header">
        <h2>{restaurant.nom}</h2>
        <div className="popup-actions">
          <button
            type="button"
            className={isFavori ? 'popup-btn popup-btn-favori-active' : 'popup-btn'}
            disabled={favoriDisabled}
            onClick={onToggleFavori}
          >
            {isFavori ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
          </button>
          {isAdmin && (
            <>
              <button type="button" className="popup-btn" onClick={onEdit}>
                Modifier
              </button>
              <button
                type="button"
                className="popup-btn popup-btn-danger"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="popup-adresse">{restaurant.adresse}</p>

      {visitesCount > 0 && averageNote !== null && (
        <div className="list-card-rating">
          <span className="list-card-rating-value">
            {formatNoteMoyenne(averageNote)}
          </span>
          <span
            className="popup-stars"
            aria-label={`Note moyenne ${formatNoteMoyenne(averageNote)} sur 5`}
          >
            {stars(Math.round(averageNote))}
          </span>
          <span className="list-card-rating-count">
            ({visitesCount} {visitesCount > 1 ? 'visites' : 'visite'})
          </span>
        </div>
      )}

      {restaurant.categories.length > 0 && (
        <CategoryBadges
          categories={restaurant.categories}
          max={restaurant.categories.length}
        />
      )}

      {restaurant.description && (
        <p className="restaurant-detail-description">{restaurant.description}</p>
      )}

      {(restaurant.telephone || restaurant.siteWeb || restaurant.horaires) && (
        <dl className="restaurant-contact-info">
          {restaurant.telephone && (
            <div className="restaurant-contact-row">
              <dt>Téléphone</dt>
              <dd>
                <a href={`tel:${restaurant.telephone}`}>{restaurant.telephone}</a>
              </dd>
            </div>
          )}
          {restaurant.siteWeb && (
            <div className="restaurant-contact-row">
              <dt>Site web</dt>
              <dd>
                <a href={restaurant.siteWeb} target="_blank" rel="noopener noreferrer">
                  {restaurant.siteWeb}
                </a>
              </dd>
            </div>
          )}
          {restaurant.horaires && (
            <div className="restaurant-contact-row">
              <dt>Horaires</dt>
              <dd>{restaurant.horaires}</dd>
            </div>
          )}
        </dl>
      )}

      <a
        className="popup-directions"
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Itinéraire
      </a>
    </div>
  )
}

export default RestaurantDetailCard
