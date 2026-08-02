import type { UtilisateurAvecFavoris, Visite } from '../api/types.ts'

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

/**
 * Note moyenne des visites d'un restaurant faites par un utilisateur
 * donné (pas la moyenne globale du restaurant) — `null` si cet
 * utilisateur n'a aucune visite sur ce restaurant.
 */
export function averageNoteForUserRestaurant(
  visites: Visite[],
  userId: string,
  restaurantId: string,
): number | null {
  const notes = visites
    .filter(
      (visite) =>
        visite.utilisateurId === userId && visite.restaurantId === restaurantId,
    )
    .map((visite) => visite.note)
  if (notes.length === 0) {
    return null
  }
  return notes.reduce((sum, note) => sum + note, 0) / notes.length
}

/**
 * Détermine si un utilisateur donné (généralement l'auteur d'une visite, pas
 * forcément l'utilisateur connecté) a ce restaurant dans ses propres favoris.
 */
export function estFavoriDeUtilisateur(
  utilisateursAvecFavoris: UtilisateurAvecFavoris[],
  utilisateurId: string,
  restaurantId: string,
): boolean {
  const utilisateur = utilisateursAvecFavoris.find(
    (u) => u.id === utilisateurId,
  )
  if (!utilisateur) {
    return false
  }
  return utilisateur.favoris.some((favori) => favori.restaurantId === restaurantId)
}
