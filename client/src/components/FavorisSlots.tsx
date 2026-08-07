import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Restaurant } from '../api/types.ts'
import { useFavoris } from '../contexts/FavorisContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import CoverPhoto from './CoverPhoto.tsx'
import RestaurantSearch from './RestaurantSearch.tsx'

/**
 * Plafond de favoris déjà appliqué côté backend (422 au-delà) — dupliqué ici
 * plutôt qu'importé de `FavorisPage.tsx` pour ne pas créer de dépendance
 * entre deux pages indépendantes ; garder la même valeur si l'une change.
 */
export const MAX_FAVORIS = 6

interface FavorisSlotsProps {
  restaurants: Restaurant[]
}

/**
 * Grille de favoris à emplacements fixes (`MAX_FAVORIS`), utilisée sur la
 * page Carte (Phase 7c). S'appuie sur le `FavorisContext` partagé (pas d'état
 * local indépendant façon `FavorisPage.tsx`, qui peut désynchroniser avec le
 * reste de l'app — cf. Phase 8 pour la correction de `FavorisPage` elle-même)
 * afin qu'un ajout/retrait ici se reflète immédiatement partout ailleurs
 * (cœur sur la fiche détail, liste, etc.) et inversement.
 *
 * Les emplacements vides affichent un bouton "+" qui ouvre une recherche
 * inline (réutilise `RestaurantSearch`) pour ajouter un restaurant sans
 * quitter la page.
 */
function FavorisSlots({ restaurants }: FavorisSlotsProps) {
  const { favoriIds, toggle, isPending } = useFavoris()
  const [searchOpen, setSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // .slice() en filet de sécurité : le backend bloque déjà tout ajout au-delà
  // de MAX_FAVORIS (422), mais une donnée incohérente ne doit jamais faire
  // dépasser la grille au-delà de ses emplacements fixes.
  const favoriRestaurants = restaurants
    .filter((restaurant) => favoriIds.has(restaurant.id))
    .slice(0, MAX_FAVORIS)
  const nonFavoriRestaurants = restaurants.filter(
    (restaurant) => !favoriIds.has(restaurant.id),
  )
  const emptySlotsCount = Math.max(0, MAX_FAVORIS - favoriRestaurants.length)

  async function handleRemove(restaurantId: string) {
    setError(null)
    try {
      await toggle(restaurantId)
    } catch (err) {
      setError(errorMessage(err, 'Le retrait du favori a échoué.'))
    }
  }

  async function handleAdd(restaurant: Restaurant) {
    setError(null)
    try {
      await toggle(restaurant.id)
      setSearchOpen(false)
    } catch (err) {
      setError(errorMessage(err, "L'ajout du favori a échoué."))
    }
  }

  return (
    <div className="favoris-slots">
      {error && <p className="popup-status popup-error">{error}</p>}
      <div className="favoris-slots-grid">
        {favoriRestaurants.map((restaurant) => {
          const photoPrincipale =
            restaurant.photos.find((photo) => photo.estPrincipale) ??
            restaurant.photos[0]
          return (
            <article
              key={restaurant.id}
              className="favoris-slot favoris-slot--filled card card--interactive"
            >
              <button
                type="button"
                className="favoris-slot-remove"
                disabled={isPending(restaurant.id)}
                aria-label={`Retirer ${restaurant.nom} des favoris`}
                onClick={() => void handleRemove(restaurant.id)}
              >
                ×
              </button>
              <Link to={`/restaurants/${restaurant.id}`} className="favoris-slot-link">
                <CoverPhoto url={photoPrincipale?.url} alt={restaurant.nom} />
                <h4>{restaurant.nom}</h4>
              </Link>
            </article>
          )
        })}

        {Array.from({ length: emptySlotsCount }).map((_, index) =>
          index === 0 && searchOpen ? (
            <div key="favoris-slot-search" className="favoris-slot favoris-slot--search">
              <RestaurantSearch
                restaurants={nonFavoriRestaurants}
                onSelect={(restaurant) => void handleAdd(restaurant)}
              />
              <button
                type="button"
                className="favoris-slot-search-cancel"
                onClick={() => setSearchOpen(false)}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              key={`favoris-slot-empty-${index}`}
              type="button"
              className="favoris-slot favoris-slot--empty"
              aria-label="Ajouter un favori"
              onClick={() => setSearchOpen(true)}
            >
              +
            </button>
          ),
        )}
      </div>
    </div>
  )
}

export default FavorisSlots
