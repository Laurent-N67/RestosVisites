import type { Categorie, Restaurant, Visite } from '../api/types.ts'

export interface RestaurantRecommande {
  restaurant: Restaurant
  categoriesCommunes: Categorie[]
  distanceKm: number | null
}

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Distance à vol d'oiseau entre deux points (formule de haversine), en km.
 */
function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Recommande des restaurants d'un style "similaire" à ceux que l'utilisateur
 * aime déjà (favoris + restaurants visités), qu'il n'a pas encore visités,
 * triés par nombre de catégories en commun (décroissant) puis par distance
 * (croissante) si une position est disponible.
 *
 * Renvoie un tableau vide si l'utilisateur n'a encore ni favori ni visite
 * (rien sur quoi baser une recommandation), ou si aucun restaurant candidat
 * ne partage de catégorie avec ses restaurants aimés.
 */
export function calculerRecommandations(
  restaurants: Restaurant[],
  visites: Visite[],
  favoriIds: Set<string>,
  utilisateurId: string,
  position: { latitude: number; longitude: number } | undefined,
  limite = 2,
): RestaurantRecommande[] {
  const restaurantsVisitesIds = new Set(
    visites
      .filter((visite) => visite.utilisateurId === utilisateurId)
      .map((visite) => visite.restaurantId),
  )

  const restaurantsAimesIds = new Set<string>([
    ...favoriIds,
    ...restaurantsVisitesIds,
  ])

  const categoriesPreferees = new Map<string, number>()
  for (const restaurant of restaurants) {
    if (!restaurantsAimesIds.has(restaurant.id)) {
      continue
    }
    for (const categorie of restaurant.categories) {
      categoriesPreferees.set(
        categorie.id,
        (categoriesPreferees.get(categorie.id) ?? 0) + 1,
      )
    }
  }

  if (categoriesPreferees.size === 0) {
    return []
  }

  const candidats: RestaurantRecommande[] = []
  for (const restaurant of restaurants) {
    if (restaurantsAimesIds.has(restaurant.id)) {
      continue
    }

    const categoriesCommunes = restaurant.categories.filter((categorie) =>
      categoriesPreferees.has(categorie.id),
    )
    if (categoriesCommunes.length === 0) {
      continue
    }

    const distanceKm = position ? haversineKm(position, restaurant) : null

    candidats.push({ restaurant, categoriesCommunes, distanceKm })
  }

  candidats.sort((a, b) => {
    if (b.categoriesCommunes.length !== a.categoriesCommunes.length) {
      return b.categoriesCommunes.length - a.categoriesCommunes.length
    }
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm
    }
    return 0
  })

  return candidats.slice(0, limite)
}
