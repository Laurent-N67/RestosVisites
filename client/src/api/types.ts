export interface Categorie {
  id: string
  nom: string
  groupe: string
}

export interface Restaurant {
  id: string
  nom: string
  adresse: string
  latitude: number
  longitude: number
  categories: Categorie[]
}

export interface Visite {
  id: string
  restaurantId: string
  date: string
  note: number
  commentaire: string | null
  urlsPhotos: string[]
}

export interface CreateRestaurantRequest {
  nom: string
  adresse: string
  latitude: number
  longitude: number
  categorieIds: string[]
}

export interface CreateVisiteRequest {
  restaurantId: string
  date: string
  note: number
  commentaire: string | null
  urlsPhotos: string[]
}

export type UpdateRestaurantRequest = CreateRestaurantRequest

export type UpdateVisiteRequest = Omit<CreateVisiteRequest, 'restaurantId'>

export interface CreatedResponse {
  id: string
}

export interface ProblemDetails {
  status?: number
  title?: string
  detail?: string
}
