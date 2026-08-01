import type {
  CreateRestaurantRequest,
  CreateVisiteRequest,
  CreatedResponse,
  ProblemDetails,
  Restaurant,
  UpdateRestaurantRequest,
  UpdateVisiteRequest,
  Visite,
} from './types.ts'

export const API_BASE_URL = 'http://localhost:5006'

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur RestosVisites.')
  }

  if (!response.ok) {
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

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getRestaurants(): Promise<Restaurant[]> {
  return request<Restaurant[]>('/api/restaurants')
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
