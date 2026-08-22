import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Restaurant, Visite } from '../api/types.ts'
import { useFavoris } from '../contexts/FavorisContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { averageNote } from '../utils/visites.ts'
import { formatNoteMoyenne, stars, villeFromAdresse } from '../utils/format.ts'
import CoverPhoto from './CoverPhoto.tsx'
import { HeartIcon } from './icons/Icons.tsx'
import RestaurantSearch from './RestaurantSearch.tsx'

/**
 * Plafond de favoris déjà appliqué côté backend (422 au-delà) — dupliqué ici
 * plutôt que recalculé ailleurs pour ne pas créer de dépendance entre pages
 * indépendantes ; garder la même valeur si le plafond backend change.
 */
export const MAX_FAVORIS = 6

interface FavorisSlotsProps {
  restaurants: Restaurant[]
  visites: Visite[]
}

/**
 * Grille de favoris à emplacements fixes (`MAX_FAVORIS`), utilisée sur la
 * page Carte (Phase 7c). S'appuie sur le `FavorisContext` partagé (pas d'état
 * local indépendant, qui peut désynchroniser avec le reste de l'app) afin
 * qu'un ajout/retrait ici se reflète immédiatement partout ailleurs (cœur sur
 * la fiche détail, liste, etc.) et inversement.
 *
 * Les emplacements vides affichent un bouton "+" qui ouvre une recherche
 * inline (réutilise `RestaurantSearch`) pour ajouter un restaurant sans
 * quitter la page.
 */
function FavorisSlots({ restaurants, visites }: FavorisSlotsProps) {
  const { favoriIds, toggle, isPending } = useFavoris()
  const [searchOpen, setSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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

  // Filet de sécurité pour la rangée mobile (défilement horizontal, cf.
  // App.css) : les emplacements passent de "vide" à "rempli" de façon
  // asynchrone quand `restaurants`/`favoriIds` arrivent après le premier
  // rendu, ce qui peut faire dériver le scroll natif du navigateur vers la
  // fin de la rangée au lieu de rester au début. `overflow-anchor: none`
  // (App.css) traite la cause ; ce reset explicite garantit le résultat
  // même si un navigateur/appareil dérive quand même.
  const hasFavoris = favoriRestaurants.length > 0
  useEffect(() => {
    if (hasFavoris && gridRef.current) {
      gridRef.current.scrollLeft = 0
    }
  }, [hasFavoris])

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
      <div className="favoris-slots-grid" ref={gridRef}>
        {favoriRestaurants.map((restaurant) => {
          const photoPrincipale =
            restaurant.photos.find((photo) => photo.estPrincipale) ??
            restaurant.photos[0]
          const average = averageNote(
            visites.filter((visite) => visite.restaurantId === restaurant.id),
          )
          const ville = villeFromAdresse(restaurant.adresse)
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
                <HeartIcon fill="currentColor" />
              </button>
              <Link to={`/restaurants/${restaurant.id}`} className="favoris-slot-link">
                <CoverPhoto url={photoPrincipale?.url} alt={restaurant.nom} />
                <h4>{restaurant.nom}</h4>
                {average !== null && (
                  <p className="favoris-slot-rating">
                    <span className="popup-stars" aria-hidden="true">
                      {stars(Math.round(average))}
                    </span>{' '}
                    {formatNoteMoyenne(average)}
                  </p>
                )}
                {ville && <p className="favoris-slot-ville">{ville}</p>}
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
