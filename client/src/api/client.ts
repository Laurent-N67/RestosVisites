import type {
  Categorie,
  CreateRestaurantRequest,
  CreateVisiteRequest,
  CreatedResponse,
  Favori,
  LoginRequest,
  ProblemDetails,
  RegisterRequest,
  Restaurant,
  Role,
  UpdateRestaurantRequest,
  UpdateVisiteRequest,
  Utilisateur,
  UtilisateurAvecFavoris,
  Visite,
} from './types.ts'

// En production, l'Api est servie par le même conteneur/origine que le client (voir Dockerfile et
// Program.cs qui sert le build React depuis wwwroot) : VITE_API_BASE_URL vaut alors une chaîne vide,
// pour des appels relatifs ("/api/..."). En dev, aucune variable n'est définie, on retombe sur le
// serveur .NET lancé séparément sur localhost:5006.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5006'

export class ApiError extends Error {
  status: number
  detail?: string

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function throwForErrorResponse(response: Response): Promise<never> {
  let title = response.statusText || `Erreur ${response.status}`
  let detail: string | undefined
  try {
    const problem = (await response.json()) as ProblemDetails
    title = problem.title ?? title
    detail = problem.detail
  } catch {
    // Corps de réponse absent ou non-JSON, on garde le message par défaut.
  }
  throw new ApiError(response.status, title, detail)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur RestosVisites.')
  }

  if (!response.ok) {
    await throwForErrorResponse(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/**
 * Résout une URL de photo pour l'affichage : les URLs relatives (renvoyées
 * par l'upload, ex. `/uploads/xxx.jpg`) sont préfixées par l'URL de l'Api,
 * tandis que les URLs externes collées par l'utilisateur sont laissées
 * telles quelles.
 */
export function resolvePhotoUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE_URL}${url}` : url
}

export interface UploadPhotoResponse {
  url: string
}

export async function uploadPhoto(file: File): Promise<UploadPhotoResponse> {
  const formData = new FormData()
  formData.append('file', file)

  let response: Response
  try {
    // Pas de header Content-Type manuel : le navigateur doit fixer la
    // boundary multipart/form-data lui-même.
    response = await fetch(`${API_BASE_URL}/api/photos`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur RestosVisites.')
  }

  if (!response.ok) {
    await throwForErrorResponse(response)
  }

  return (await response.json()) as UploadPhotoResponse
}

export function getRestaurants(): Promise<Restaurant[]> {
  return request<Restaurant[]>('/api/restaurants')
}

export function getCategories(): Promise<Categorie[]> {
  return request<Categorie[]>('/api/categories')
}

export function createRestaurant(
  payload: CreateRestaurantRequest,
): Promise<CreatedResponse> {
  return request<CreatedResponse>('/api/restaurants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRestaurant(
  id: string,
  payload: UpdateRestaurantRequest,
): Promise<void> {
  return request<void>(`/api/restaurants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteRestaurant(id: string): Promise<void> {
  return request<void>(`/api/restaurants/${id}`, { method: 'DELETE' })
}

export function getVisites(restaurantId: string): Promise<Visite[]> {
  return request<Visite[]>(`/api/restaurants/${restaurantId}/visites`)
}

export function getAllVisites(): Promise<Visite[]> {
  return request<Visite[]>('/api/visites')
}

export function createVisite(
  payload: CreateVisiteRequest,
): Promise<CreatedResponse> {
  return request<CreatedResponse>('/api/visites', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateVisite(
  id: string,
  payload: UpdateVisiteRequest,
): Promise<void> {
  return request<void>(`/api/visites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteVisite(id: string): Promise<void> {
  return request<void>(`/api/visites/${id}`, { method: 'DELETE' })
}

export function register(payload: RegisterRequest): Promise<Utilisateur> {
  return request<Utilisateur>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginRequest): Promise<Utilisateur> {
  return request<Utilisateur>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' })
}

export function getMe(): Promise<Utilisateur> {
  return request<Utilisateur>('/api/auth/me')
}

export function getMesFavoris(): Promise<Favori[]> {
  return request<Favori[]>('/api/favoris')
}

export function addFavori(restaurantId: string): Promise<void> {
  return request<void>(`/api/favoris/${restaurantId}`, { method: 'PUT' })
}

export function removeFavori(restaurantId: string): Promise<void> {
  return request<void>(`/api/favoris/${restaurantId}`, { method: 'DELETE' })
}

export function getUtilisateursAvecFavoris(): Promise<UtilisateurAvecFavoris[]> {
  return request<UtilisateurAvecFavoris[]>('/api/utilisateurs')
}

export function changerRole(id: string, nouveauRole: Role): Promise<void> {
  return request<void>(`/api/utilisateurs/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ nouveauRole }),
  })
}
