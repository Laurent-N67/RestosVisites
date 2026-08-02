import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Utilisateur } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider, useFavoris } from './FavorisContext.tsx'

const { getMesFavorisMock, addFavoriMock, removeFavoriMock } = vi.hoisted(
  () => ({
    getMesFavorisMock: vi.fn(),
    addFavoriMock: vi.fn(),
    removeFavoriMock: vi.fn(),
  }),
)

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    getMesFavoris: getMesFavorisMock,
    addFavori: addFavoriMock,
    removeFavori: removeFavoriMock,
  }
})

let mockUser: Utilisateur | null = null

vi.mock('./AuthContext.tsx', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const utilisateur: Utilisateur = {
  id: 'user-1',
  email: 'user@example.com',
  nomAffiche: 'Une Personne',
  role: Role.Simple,
}

describe('FavorisProvider / useFavoris', () => {
  beforeEach(() => {
    mockUser = null
    getMesFavorisMock.mockReset()
    addFavoriMock.mockReset()
    removeFavoriMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("ne charge pas les favoris quand personne n'est connecté", async () => {
    const { result } = renderHook(() => useFavoris(), {
      wrapper: FavorisProvider,
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.favoriIds.size).toBe(0)
    expect(getMesFavorisMock).not.toHaveBeenCalled()
  })

  it("charge les favoris de l'utilisateur connecté une seule fois", async () => {
    mockUser = utilisateur
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    const { result } = renderHook(() => useFavoris(), {
      wrapper: FavorisProvider,
    })

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.favoriIds.has('restaurant-1')).toBe(true)
    expect(getMesFavorisMock).toHaveBeenCalledTimes(1)
  })

  it('ajoute un restaurant aux favoris', async () => {
    mockUser = utilisateur
    getMesFavorisMock.mockResolvedValue([])
    addFavoriMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useFavoris(), {
      wrapper: FavorisProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggle('restaurant-1')
    })

    expect(addFavoriMock).toHaveBeenCalledWith('restaurant-1')
    expect(result.current.favoriIds.has('restaurant-1')).toBe(true)
    expect(result.current.isPending('restaurant-1')).toBe(false)
  })

  it('retire un restaurant déjà favori', async () => {
    mockUser = utilisateur
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    removeFavoriMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useFavoris(), {
      wrapper: FavorisProvider,
    })

    await waitFor(() => expect(result.current.favoriIds.has('restaurant-1')).toBe(true))

    await act(async () => {
      await result.current.toggle('restaurant-1')
    })

    expect(removeFavoriMock).toHaveBeenCalledWith('restaurant-1')
    expect(result.current.favoriIds.has('restaurant-1')).toBe(false)
  })

  it("propage l'erreur 422 quand la limite de 6 favoris est atteinte", async () => {
    mockUser = utilisateur
    getMesFavorisMock.mockResolvedValue([])
    addFavoriMock.mockRejectedValue(
      new ApiError(422, 'Règle métier violée', 'Vous avez déjà 6 favoris.'),
    )
    const { result } = renderHook(() => useFavoris(), {
      wrapper: FavorisProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.toggle('restaurant-1')
      }),
    ).rejects.toThrow('Règle métier violée')

    expect(result.current.favoriIds.has('restaurant-1')).toBe(false)
    expect(result.current.isPending('restaurant-1')).toBe(false)
  })

  it('vide les favoris à la déconnexion', async () => {
    mockUser = utilisateur
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    const { result, rerender } = renderHook(() => useFavoris(), {
      wrapper: FavorisProvider,
    })

    await waitFor(() => expect(result.current.favoriIds.has('restaurant-1')).toBe(true))

    mockUser = null
    rerender()

    await waitFor(() => expect(result.current.favoriIds.size).toBe(0))
  })
})
