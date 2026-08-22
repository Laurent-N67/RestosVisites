import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'

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
 * Note moyenne globale des visites d'un restaurant, tous utilisateurs
 * confondus — `null` si aucune visite.
 */
export function averageNote(visites: Visite[]): number | null {
  if (visites.length === 0) {
    return null
  }
  return visites.reduce((sum, visite) => sum + visite.note, 0) / visites.length
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

/**
 * Nombre d'utilisateurs ayant ce restaurant dans leurs favoris (tous
 * utilisateurs confondus) — affiché comme statistique communautaire sur la
 * fiche restaurant.
 */
export function favorisCountForRestaurant(
  utilisateursAvecFavoris: UtilisateurAvecFavoris[],
  restaurantId: string,
): number {
  return utilisateursAvecFavoris.filter((u) =>
    u.favoris.some((favori) => favori.restaurantId === restaurantId),
  ).length
}

export interface JournalEntry {
  visite: Visite
  restaurant: Restaurant
}

/**
 * Construit le journal chronologique des visites d'un utilisateur (une
 * entrée par visite, jointe à son restaurant), triées de la plus récente à
 * la plus ancienne. Utilisé par la page "Visites" (journal personnel) et par
 * la section "Visites récentes" de la page Carte.
 */
export function buildJournal(
  restaurants: Restaurant[],
  visites: Visite[],
  userId: string,
): JournalEntry[] {
  const restaurantsById = new Map(restaurants.map((r) => [r.id, r]))
  const entries: JournalEntry[] = []
  for (const visite of visites) {
    if (visite.utilisateurId !== userId) {
      continue
    }
    const restaurant = restaurantsById.get(visite.restaurantId)
    if (!restaurant) {
      // Donnée incohérente (restaurant supprimé mais visite orpheline) :
      // on ignore l'entrée plutôt que de planter ou d'afficher un nom vide.
      continue
    }
    entries.push({ visite, restaurant })
  }
  return entries.sort((a, b) => b.visite.date.localeCompare(a.visite.date))
}
