import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Restaurant } from '../api/types.ts'
import { useDeleteRestaurant } from './useDeleteRestaurant.ts'

const { deleteRestaurantMock } = vi.hoisted(() => ({
  deleteRestaurantMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>(
      '../api/client.ts',
    )
  return { ...actual, deleteRestaurant: deleteRestaurantMock }
})

const restaurant: Restaurant = {
  id: 'restaurant-1',
  nom: 'Le Bon Coin',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

describe('useDeleteRestaurant', () => {
  beforeEach(() => {
    deleteRestaurantMock.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('supprime le restaurant et appelle onDeleted', async () => {
    deleteRestaurantMock.mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteRestaurant(onDeleted))

    await act(async () => {
      await result.current.handleDelete(restaurant)
    })

    expect(deleteRestaurantMock).toHaveBeenCalledWith('restaurant-1')
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it("n'appelle pas l'Api si la confirmation est refusée", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteRestaurant(onDeleted))

    await act(async () => {
      await result.current.handleDelete(restaurant)
    })

    expect(deleteRestaurantMock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(result.current.deleting).toBe(false)
  })

  it("expose un message d'erreur et réinitialise l'état deleting en cas d'échec", async () => {
    deleteRestaurantMock.mockRejectedValue(
      new ApiError(409, 'Conflit', 'Le restaurant a encore des visites.'),
    )
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteRestaurant(onDeleted))

    await act(async () => {
      await result.current.handleDelete(restaurant)
    })

    expect(onDeleted).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Le restaurant a encore des visites.')
    expect(result.current.deleting).toBe(false)
  })

  it("retombe sur le message par défaut si l'erreur n'est pas une ApiError", async () => {
    deleteRestaurantMock.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useDeleteRestaurant(vi.fn()))

    await act(async () => {
      await result.current.handleDelete(restaurant)
    })

    expect(result.current.error).toBe(
      'La suppression du restaurant a échoué.',
    )
  })
})
