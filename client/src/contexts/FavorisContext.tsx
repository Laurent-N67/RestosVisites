import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { addFavori, getMesFavoris, removeFavori } from '../api/client.ts'
import { useAuth } from './AuthContext.tsx'

interface FavorisContextValue {
  favoriIds: Set<string>
  loading: boolean
  isPending: (restaurantId: string) => boolean
  toggle: (restaurantId: string) => Promise<void>
}

const FavorisContext = createContext<FavorisContextValue | null>(null)

interface FavorisProviderProps {
  children: ReactNode
}

export function FavorisProvider({ children }: FavorisProviderProps) {
  const { user } = useAuth()
  const [favoriIds, setFavoriIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  // Un seul chargement des favoris par session, partagé par tous les
  // composants qui affichent un bouton favori (liste, carte, fiche détail),
  // plutôt qu'un appel par instance de carte/marqueur.
  useEffect(() => {
    if (!user) {
      setFavoriIds(new Set())
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    getMesFavoris()
      .then((favoris) => {
        if (!cancelled) {
          setFavoriIds(new Set(favoris.map((f) => f.restaurantId)))
        }
      })
      .catch(() => {
        // Favoris indisponibles (ex. hors-ligne) : on suppose aucun favori.
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const isPending = useCallback(
    (restaurantId: string) => pendingIds.has(restaurantId),
    [pendingIds],
  )

  const toggle = useCallback(
    async (restaurantId: string) => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.add(restaurantId)
        return next
      })
      try {
        if (favoriIds.has(restaurantId)) {
          await removeFavori(restaurantId)
          setFavoriIds((prev) => {
            const next = new Set(prev)
            next.delete(restaurantId)
            return next
          })
        } else {
          // Peut échouer avec un 422 (max 6 favoris atteint) : l'erreur
          // remonte à l'appelant, qui l'affiche près du bouton concerné.
          await addFavori(restaurantId)
          setFavoriIds((prev) => {
            const next = new Set(prev)
            next.add(restaurantId)
            return next
          })
        }
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(restaurantId)
          return next
        })
      }
    },
    [favoriIds],
  )

  return (
    <FavorisContext.Provider value={{ favoriIds, loading, isPending, toggle }}>
      {children}
    </FavorisContext.Provider>
  )
}

export function useFavoris(): FavorisContextValue {
  const context = useContext(FavorisContext)
  if (!context) {
    throw new Error('useFavoris doit être utilisé à l\'intérieur d\'un FavorisProvider.')
  }
  return context
}
