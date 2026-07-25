export interface Restaurant {
  id: string
  nom: string
  adresse: string
  latitude: number
  longitude: number
}

export interface Visite {
  id: string
  restaurantId: string
  date: string
  note: number
  commentaire: string | null
  categories: string[]
  urlsPhotos: string[]
}

export interface CreateRestaurantRequest {
  nom: string
  adresse: string
  latitude: number
  longitude: number
}

export interface CreateVisiteRequest {
  restaurantId: string
  date: string
  note: number
  commentaire: string | null
  nomsCategories: string[]
  urlsPhotos: string[]
}

export interface CreatedResponse {
  id: string
}

export interface ProblemDetails {
  status?: number
  title?: string
  detail?: string
}
