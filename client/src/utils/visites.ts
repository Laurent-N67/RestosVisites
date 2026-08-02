import type { Visite } from '../api/types.ts'

/**
 * Détermine si un utilisateur donné a au moins une visite parmi celles d'un
 * restaurant (filtre "déjà visité par moi" de la vue Liste).
 */
export function hasVisiteByUser(
  visitesForRestaurant: Visite[],
  userId: string,
): boolean {
  return visitesForRestaurant.some((visite) => visite.utilisateurId === userId)
}

/**
 * Détermine si une note moyenne satisfait un seuil minimal. Un seuil à 0
 * (aucun filtre sélectionné) correspond toujours, y compris pour un
 * restaurant sans note moyenne connue.
 */
export function meetsRatingThreshold(
  averageNote: number | null,
  minNote: number,
): boolean {
  if (minNote <= 0) {
    return true
  }
  return averageNote !== null && averageNote >= minNote
}
