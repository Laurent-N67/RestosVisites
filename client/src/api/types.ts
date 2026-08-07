export interface Categorie {
  id: string
  nom: string
  groupe: string
}

export interface RestaurantPhoto {
  id: string
  url: string
  estPrincipale: boolean
  ordre: number
}

export interface Restaurant {
  id: string
  nom: string
  adresse: string
  latitude: number
  longitude: number
  categories: Categorie[]
  description: string | null
  telephone: string | null
  siteWeb: string | null
  horaires: string | null
  photos: RestaurantPhoto[]
}

export interface Visite {
  id: string
  restaurantId: string
  date: string
  note: number
  commentaire: string | null
  urlsPhotos: string[]
  utilisateurId: string
  utilisateurNomAffiche: string
}

// `RoleUtilisateur` côté serveur est un enum C# sans JsonStringEnumConverter,
// il sérialise donc en nombre (0 = Simple, 1 = Admin), jamais en chaîne.
export const Role = {
  Simple: 0,
  Admin: 1,
} as const

export type Role = (typeof Role)[keyof typeof Role]

export interface Utilisateur {
  id: string
  email: string
  nomAffiche: string
  role: Role
}

export interface RegisterRequest {
  email: string
  nomAffiche: string
  motDePasse: string
}

export interface LoginRequest {
  email: string
  motDePasse: string
}

export interface Favori {
  restaurantId: string
  dateAjout: string
}

export interface FavoriAvecRestaurant {
  restaurantId: string
  restaurantNom: string
  dateAjout: string
}

export interface UtilisateurAvecFavoris {
  id: string
  email: string | null
  nomAffiche: string
  role: Role
  favoris: FavoriAvecRestaurant[]
}

export interface CreateRestaurantRequest {
  nom: string
  adresse: string
  latitude: number
  longitude: number
  categorieIds: string[]
  description?: string | null
  telephone?: string | null
  siteWeb?: string | null
  horaires?: string | null
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

export interface AjouterPhotoRestaurantResponse {
  photoId: string
}

export interface ProblemDetails {
  status?: number
  title?: string
  detail?: string
}
