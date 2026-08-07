import { useEffect, useMemo, useState } from 'react'
import type { Restaurant, Visite } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useFavoris } from '../contexts/FavorisContext.tsx'
import type { SessionPosition } from '../utils/geolocation.ts'
import { getSessionPosition } from '../utils/geolocation.ts'
import type { RestaurantRecommande } from '../utils/recommandations.ts'
import { calculerRecommandations } from '../utils/recommandations.ts'

/**
 * Restaurants d'un style "similaire" à ceux que l'utilisateur connecté aime
 * déjà (favoris + visites), pas encore visités par lui, triés par proximité.
 * Peut être appelé depuis plusieurs composants en parallèle (section
 * "Recommandé pour vous", marqueurs de carte) : la position géographique
 * est mise en cache au niveau du module par `getSessionPosition`, donc une
 * seule demande de permission de géolocalisation est faite par session,
 * quel que soit le nombre d'appelants de ce hook.
 */
export function useRecommandations(
  restaurants: Restaurant[],
  visites: Visite[],
  limite = 2,
): RestaurantRecommande[] {
  const { user } = useAuth()
  const { favoriIds } = useFavoris()
  const [position, setPosition] = useState<SessionPosition | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    getSessionPosition().then((resolved) => {
      if (!cancelled) {
        setPosition(resolved)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(() => {
    if (!user) {
      return []
    }
    return calculerRecommandations(
      restaurants,
      visites,
      favoriIds,
      user.id,
      position,
      limite,
    )
  }, [restaurants, visites, favoriIds, user, position, limite])
}
