import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMesFavoris, removeFavori } from '../api/client.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import { errorMessage } from '../utils/errors.ts'
import { formatDate, stars } from '../utils/format.ts'
import CoverPhoto from './CoverPhoto.tsx'

interface FavorisPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
}

const MAX_FAVORIS = 6

function FavorisPage({ restaurants, visites }: FavorisPageProps) {
  const [favoriIds, setFavoriIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadFavoris = useCallback(async () => {
    setLoading(true)
    try {
      const favoris = await getMesFavoris()
      setFavoriIds(new Set(favoris.map((favori) => favori.restaurantId)))
      setLoadError(null)
    } catch (err) {
      setLoadError(errorMessage(err, 'Impossible de charger vos favoris.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFavoris()
  }, [loadFavoris])

  async function handleRemove(restaurantId: string) {
    setPendingId(restaurantId)
    setActionError(null)
    try {
      await removeFavori(restaurantId)
      setFavoriIds((prev) => {
        const next = new Set(prev)
        next.delete(restaurantId)
        return next
      })
    } catch (err) {
      setActionError(errorMessage(err, 'Le retrait du favori a échoué.'))
    } finally {
      setPendingId(null)
    }
  }

  const favoriRestaurants = restaurants.filter((restaurant) =>
    favoriIds.has(restaurant.id),
  )

  return (
    <div className="detail-page favoris-page">
      <h2>Mes favoris</h2>
      <p className="favoris-count">
        {favoriIds.size} / {MAX_FAVORIS} favoris
      </p>

      {loading && <p className="popup-status">Chargement…</p>}
      {loadError && <p className="popup-status popup-error">{loadError}</p>}
      {actionError && <p className="popup-status popup-error">{actionError}</p>}

      {!loading && favoriRestaurants.length === 0 && (
        <p className="list-empty">Aucun restaurant favori pour le moment.</p>
      )}

      {favoriRestaurants.length > 0 && (
        <div className="restaurant-cards">
          {favoriRestaurants.map((restaurant) => {
            const restaurantVisites = visites
              .filter((visite) => visite.restaurantId === restaurant.id)
              .sort((a, b) => b.date.localeCompare(a.date))

            return (
              <article
                key={restaurant.id}
                className="restaurant-card card card--interactive"
              >
                <CoverPhoto
                  url={restaurantVisites[0]?.urlsPhotos[0]}
                  alt={restaurant.nom}
                />
                <div className="popup-header">
                  <h3>{restaurant.nom}</h3>
                  <button
                    type="button"
                    className="popup-btn popup-btn-danger"
                    disabled={pendingId === restaurant.id}
                    onClick={() => void handleRemove(restaurant.id)}
                  >
                    {pendingId === restaurant.id ? 'Retrait…' : '★ Retirer'}
                  </button>
                </div>

                <p className="popup-adresse">{restaurant.adresse}</p>

                {restaurantVisites.length === 0 ? (
                  <p className="popup-status">Aucune visite enregistrée.</p>
                ) : (
                  <ul className="popup-visites-list">
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
                        {visite.commentaire && (
                          <p className="popup-visite-commentaire">
                            {visite.commentaire}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  className="popup-directions"
                  to={`/restaurants/${restaurant.id}`}
                >
                  Voir la fiche complète
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FavorisPage
