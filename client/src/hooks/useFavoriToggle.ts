import { useCallback, useEffect, useState } from 'react'
import { addFavori, getMesFavoris, removeFavori } from '../api/client.ts'
import { errorMessage } from '../utils/errors.ts'

/**
 * Statut favori et bascule ajout/retrait pour un restaurant donné. Les
 * favoris sont une donnée par utilisateur non chargée globalement par
 * `App` : ce hook fait son propre appel, comme `FavorisPage`.
 */
export function useFavoriToggle(restaurantId: string) {
  const [isFavori, setIsFavori] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getMesFavoris()
      .then((favoris) => {
        if (!cancelled) {
          setIsFavori(favoris.some((f) => f.restaurantId === restaurantId))
        }
      })
      .catch(() => {
        // Statut favori indisponible (ex. hors-ligne) : on suppose non-favori.
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  const toggle = useCallback(async () => {
    setPending(true)
    setError(null)
    try {
      if (isFavori) {
        await removeFavori(restaurantId)
        setIsFavori(false)
      } else {
        await addFavori(restaurantId)
        setIsFavori(true)
      }
    } catch (err) {
      setError(errorMessage(err, 'La mise à jour du favori a échoué.'))
    } finally {
      setPending(false)
    }
  }, [isFavori, restaurantId])

  return { isFavori, loading, pending, error, toggle }
}
