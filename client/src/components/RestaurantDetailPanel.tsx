import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { averageNote } from '../utils/visites.ts'
import RestaurantDetailCard from './RestaurantDetailCard.tsx'
import { VisitesSection } from './RestaurantMarker.tsx'
import type { VisitesState } from './RestaurantMarker.tsx'

interface RestaurantDetailPanelProps {
  restaurant: Restaurant
  visitesState: VisitesState
  utilisateursAvecFavoris: UtilisateurAvecFavoris[]
  onClose: () => void
  onEditRestaurant: (restaurant: Restaurant) => void
  onRestaurantDeleted: () => void
  onEditVisite: (visite: Visite) => void
  onVisitesRefresh: (restaurantId: string) => void
  onVisiteDeleted: () => void
  onAddVisite: (restaurantId: string) => void
}

/**
 * Panneau de détail persistant de la vue Carte (3e colonne desktop / plein
 * écran mobile) : remplace l'ancienne Popup Leaflet de RestaurantMarker.
 * Reprend le câblage `useFavoriToggle`/`useDeleteRestaurant`/`useDeleteVisite`
 * de RestaurantDetailPage (page /restaurants/:id), en autonome — RestaurantsMap
 * ne fait que sélectionner le restaurant et lui transmettre son état de
 * visites déjà chargé.
 */
function RestaurantDetailPanel({
  restaurant,
  visitesState,
  utilisateursAvecFavoris,
  onClose,
  onEditRestaurant,
  onRestaurantDeleted,
  onEditVisite,
  onVisitesRefresh,
  onVisiteDeleted,
  onAddVisite,
}: RestaurantDetailPanelProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin

  const {
    deleting: deletingRestaurant,
    error: restaurantError,
    handleDelete: handleDeleteRestaurant,
  } = useDeleteRestaurant(() => {
    onRestaurantDeleted()
    onClose()
  })

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

  const restaurantAverageNote =
    visitesState.status === 'loaded' ? averageNote(visitesState.visites) : null
  const visitesCount =
    visitesState.status === 'loaded' ? visitesState.visites.length : 0

  return (
    <div className="restaurant-detail-panel">
      <button
        type="button"
        className="detail-panel-close"
        aria-label="Fermer"
        onClick={onClose}
      >
        ×
      </button>

      <RestaurantDetailCard
        restaurant={restaurant}
        averageNote={restaurantAverageNote}
        visitesCount={visitesCount}
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

      <button
        type="button"
        className="detail-panel-add-visite popup-btn"
        onClick={() => onAddVisite(restaurant.id)}
      >
        + Ajouter une visite
      </button>

      <h3 className="detail-visites-title">Historique des visites</h3>

      <VisitesSection
        restaurantId={restaurant.id}
        visitesState={visitesState}
        utilisateursAvecFavoris={utilisateursAvecFavoris}
        onEditVisite={onEditVisite}
        onDeleteVisite={(visite) => void handleDeleteVisite(visite)}
        deletingVisiteId={deletingVisiteId}
        visiteError={visiteError}
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default RestaurantDetailPanel
