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

// `Compagnie` côté serveur est un enum C# sans JsonStringEnumConverter, il sérialise donc en
// nombre, jamais en chaîne (même convention que Role — voir ce commentaire).
export const Compagnie = {
  Seul: 0,
  Couple: 1,
  Amis: 2,
  Famille: 3,
} as const
export type Compagnie = (typeof Compagnie)[keyof typeof Compagnie]

// `Reservation` côté serveur est un enum C# sans JsonStringEnumConverter, il sérialise donc en
// nombre, jamais en chaîne (même convention que Role — voir ce commentaire).
export const Reservation = {
  Indifferent: 0,
  Oui: 1,
  Non: 2,
} as const
export type Reservation = (typeof Reservation)[keyof typeof Reservation]

export interface Visite {
  id: string
  restaurantId: string
  date: string
  note: number
  commentaire: string | null
  urlsPhotos: string[]
  utilisateurId: string
  utilisateurNomAffiche: string
  avecQui: Compagnie | null
  reservation: Reservation | null
  budget: number | null
  tempsAttente: number | null
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
  avecQui?: Compagnie | null
  reservation?: Reservation | null
  budget?: number | null
  tempsAttente?: number | null
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
