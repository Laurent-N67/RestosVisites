import { Link } from 'react-router-dom'
import type { Visite } from '../api/types.ts'
import type { RestaurantRecommande } from '../utils/recommandations.ts'
import { averageNote } from '../utils/visites.ts'
import { formatDistanceKm, formatNoteMoyenne, stars, villeFromAdresse } from '../utils/format.ts'
import CategoryBadges from './CategoryBadges.tsx'
import CoverPhoto from './CoverPhoto.tsx'

interface RecommendationCardProps {
  recommandation: RestaurantRecommande
  visites: Visite[]
  /**
   * Variante dense (photo + nom + note + adresse, pas de badges de catégorie
   * ni de lien "Voir la fiche complète") utilisée dans la bande basse
   * compacte de la page Carte, où plusieurs cartes doivent tenir côte à côte
   * sur une hauteur réduite. `false` par défaut : rend la carte complète
   * telle qu'utilisée par `FavorisPage`.
   */
  compact?: boolean
}

/**
 * Carte "Recommandé pour vous" — extraite de `FavorisPage` (Phase 7c) pour
 * être réutilisée telle quelle par la section Recommandations de la page
 * Carte, plutôt que dupliquée dans un second composant.
 */
function RecommendationCard({ recommandation, visites, compact = false }: RecommendationCardProps) {
  const { restaurant, categoriesCommunes, distanceKm, score } = recommandation
  const restaurantVisites = visites
    .filter((visite) => visite.restaurantId === restaurant.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const coverUrl = restaurantVisites[0]?.urlsPhotos[0]

  if (compact) {
    const average = averageNote(restaurantVisites)
    return (
      <Link
        to={`/restaurants/${restaurant.id}`}
        className="restaurant-card restaurant-card--compact card card--interactive"
      >
        <CoverPhoto url={coverUrl} alt={restaurant.nom} />
        <h3>{restaurant.nom}</h3>
        {average !== null && (
          <p
            className="recommandation-compact-rating"
            aria-label={`Note moyenne ${formatNoteMoyenne(average)} sur 5`}
          >
            <span className="popup-stars" aria-hidden="true">
              {stars(Math.round(average))}
            </span>{' '}
            {formatNoteMoyenne(average)}
          </p>
        )}
        <p className="recommandation-compact-meta">{villeFromAdresse(restaurant.adresse)}</p>
        <span className="recommandation-score-badge">{score}% compatible</span>
      </Link>
    )
  }

  return (
    <article className="restaurant-card card card--interactive">
      <CoverPhoto url={coverUrl} alt={restaurant.nom} />
      <h3>{restaurant.nom}</h3>
      <p className="popup-adresse">{restaurant.adresse}</p>
      <CategoryBadges categories={categoriesCommunes} />
      {distanceKm !== null && (
        <p className="recommandation-distance">{formatDistanceKm(distanceKm)}</p>
      )}
      <Link className="popup-directions" to={`/restaurants/${restaurant.id}`}>
        Voir la fiche complète
      </Link>
    </article>
  )
}

export default RecommendationCard
