import { Link } from 'react-router-dom'
import type { Visite } from '../api/types.ts'
import type { RestaurantRecommande } from '../utils/recommandations.ts'
import { formatDistanceKm } from '../utils/format.ts'
import CategoryBadges from './CategoryBadges.tsx'
import CoverPhoto from './CoverPhoto.tsx'

interface RecommendationCardProps {
  recommandation: RestaurantRecommande
  visites: Visite[]
}

/**
 * Carte "Recommandé pour vous" — extraite de `FavorisPage` (Phase 7c) pour
 * être réutilisée telle quelle par la section Recommandations de la page
 * Carte, plutôt que dupliquée dans un second composant.
 */
function RecommendationCard({ recommandation, visites }: RecommendationCardProps) {
  const { restaurant, categoriesCommunes, distanceKm } = recommandation
  const restaurantVisites = visites
    .filter((visite) => visite.restaurantId === restaurant.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <article className="restaurant-card card card--interactive">
      <CoverPhoto url={restaurantVisites[0]?.urlsPhotos[0]} alt={restaurant.nom} />
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
