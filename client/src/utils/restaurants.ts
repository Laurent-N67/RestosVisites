import type { Restaurant, RestaurantPhoto } from '../api/types.ts'

export function photoPrincipale(restaurant: Restaurant): RestaurantPhoto | undefined {
  return restaurant.photos.find((photo) => photo.estPrincipale) ?? restaurant.photos[0]
}

export function cuisineType(restaurant: Restaurant): string | undefined {
  return restaurant.categories.find((c) => c.groupe === 'Type de cuisine')?.nom
}
