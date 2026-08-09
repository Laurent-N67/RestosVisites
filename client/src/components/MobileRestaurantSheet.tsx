import { Link } from 'react-router-dom'
import type { Restaurant } from '../api/types.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { formatDate, formatNoteMoyenne, stars, villeFromAdresse } from '../utils/format.ts'
import { cuisineType, photoPrincipale } from '../utils/restaurants.ts'
import type { NoteSummary } from './RestaurantsMap.tsx'
import CoverPhoto from './CoverPhoto.tsx'
import { HeartIcon } from './icons/Icons.tsx'

export interface PersonalVisitSummary {
  count: number
  lastDate: string
}

interface MobileRestaurantSheetProps {
  restaurant: Restaurant | null
  noteSummary: NoteSummary | null
  personalSummary: PersonalVisitSummary | null
  onClose: () => void
  onAddVisite: (restaurantId: string) => void
}

/**
 * Fiche compacte mobile-only (≤900px, cf. App.css) : remplace, sur mobile,
 * le panneau plein écran `RestaurantDetailPanel`/`.map-detail-column`
 * (toujours utilisé tel quel sur desktop, cf. RestaurantsMap.tsx) par une
 * feuille ancrée en bas de l'écran quand un restaurant est sélectionné sur
 * la carte — l'utilisateur reste sur la carte plutôt que de perdre son
 * contexte, et accède à la fiche complète via "Voir la fiche" si besoin.
 *
 * Toujours montée (comme `.map-sidebar-toggle`, même convention CSS-only du
 * projet) : `display: none` au-dessus de 900px, et pas de rendu du tout tant
 * qu'aucun restaurant n'est sélectionné (indépendant du viewport).
 */
function MobileRestaurantSheet({
  restaurant,
  noteSummary,
  personalSummary,
  onClose,
  onAddVisite,
}: MobileRestaurantSheetProps) {
  const {
    isFavori,
    loading: favoriLoading,
    pending: favoriPending,
    error: favoriError,
    toggle: toggleFavori,
  } = useFavoriToggle(restaurant?.id ?? '')

  if (!restaurant) {
    return null
  }

  const cover = photoPrincipale(restaurant)
  const cuisine = cuisineType(restaurant)
  const ville = villeFromAdresse(restaurant.adresse)
  const meta = [cuisine, ville].filter(Boolean).join(' · ')

  return (
    <>
      <div className="mobile-sheet-backdrop" onClick={onClose} />
      <div className="mobile-sheet" role="dialog" aria-label={`Aperçu de ${restaurant.nom}`}>
        <button
          type="button"
          className="mobile-sheet-handle"
          aria-label="Fermer l'aperçu"
          onClick={onClose}
        />
        <button
          type="button"
          className="mobile-sheet-close"
          aria-label="Fermer l'aperçu"
          onClick={onClose}
        >
          ×
        </button>
        <div className="mobile-sheet-content">
          <div className="mobile-sheet-thumb">
            <CoverPhoto url={cover?.url} alt={restaurant.nom} />
          </div>
          <div className="mobile-sheet-body">
            <div className="mobile-sheet-title-row">
              <h3>{restaurant.nom}</h3>
              <button
                type="button"
                className={
                  isFavori
                    ? 'mobile-sheet-favori mobile-sheet-favori--active'
                    : 'mobile-sheet-favori'
                }
                disabled={favoriLoading || favoriPending}
                aria-label={
                  isFavori
                    ? `Retirer ${restaurant.nom} des favoris`
                    : `Ajouter ${restaurant.nom} aux favoris`
                }
                onClick={() => void toggleFavori()}
              >
                <HeartIcon fill={isFavori ? 'currentColor' : 'none'} />
              </button>
            </div>
            {noteSummary && (
              <p
                className="mobile-sheet-rating"
                aria-label={`Note moyenne ${formatNoteMoyenne(noteSummary.average)} sur 5`}
              >
                <span className="popup-stars" aria-hidden="true">
                  {stars(Math.round(noteSummary.average))}
                </span>
                {formatNoteMoyenne(noteSummary.average)} ({noteSummary.count} avis)
              </p>
            )}
            {meta && <p className="mobile-sheet-meta">{meta}</p>}
            {personalSummary && (
              <p className="mobile-sheet-visits">
                {personalSummary.count} {personalSummary.count > 1 ? 'visites' : 'visite'} ·
                Dernière visite le {formatDate(personalSummary.lastDate)}
              </p>
            )}
            {favoriError && <p className="popup-status popup-error">{favoriError}</p>}
          </div>
        </div>
        <div className="mobile-sheet-actions">
          <Link
            to={`/restaurants/${restaurant.id}`}
            className="restaurant-card-cta mobile-sheet-cta-primary"
          >
            Voir la fiche
          </Link>
          <button
            type="button"
            className="mobile-sheet-cta-secondary"
            aria-label={`Ajouter une visite pour ${restaurant.nom}`}
            onClick={() => onAddVisite(restaurant.id)}
          >
            + Ajouter une visite
          </button>
        </div>
      </div>
    </>
  )
}

export default MobileRestaurantSheet
