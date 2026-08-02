import { useCallback, useState } from 'react'
import { useFavoris } from '../contexts/FavorisContext.tsx'
import { errorMessage } from '../utils/errors.ts'

/**
 * Statut favori et bascule ajout/retrait pour un restaurant donné, adossé
 * au `FavorisContext` partagé : les favoris ne sont chargés qu'une fois par
 * session, pas une fois par instance de ce hook (liste, carte, fiche détail
 * peuvent chacun en avoir plusieurs instances montées simultanément).
 */
export function useFavoriToggle(restaurantId: string) {
  const { favoriIds, loading, isPending, toggle: toggleFavori } = useFavoris()
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(async () => {
    setError(null)
    try {
      await toggleFavori(restaurantId)
    } catch (err) {
      setError(errorMessage(err, 'La mise à jour du favori a échoué.'))
    }
  }, [restaurantId, toggleFavori])

  return {
    isFavori: favoriIds.has(restaurantId),
    loading,
    pending: isPending(restaurantId),
    error,
    toggle,
  }
}
