import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Visite } from '../api/types.ts'
import { useDeleteVisite } from './useDeleteVisite.ts'

const { deleteVisiteMock } = vi.hoisted(() => ({
  deleteVisiteMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>(
      '../api/client.ts',
    )
  return { ...actual, deleteVisite: deleteVisiteMock }
})

const visite: Visite = {
  id: 'visite-1',
  restaurantId: 'restaurant-1',
  date: '2026-08-02',
  note: 4,
  commentaire: null,
  urlsPhotos: [],
  utilisateurId: 'user-1',
  utilisateurNomAffiche: 'Une Personne',
  avecQui: null,
  reservation: null,
  budget: null,
  tempsAttente: null,
}

describe('useDeleteVisite', () => {
  beforeEach(() => {
    deleteVisiteMock.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('supprime la visite et appelle onDeleted avec le restaurantId', async () => {
    deleteVisiteMock.mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteVisite(onDeleted))

    await act(async () => {
      await result.current.handleDelete(visite)
    })

    expect(deleteVisiteMock).toHaveBeenCalledWith('visite-1')
    expect(onDeleted).toHaveBeenCalledWith('restaurant-1')
    expect(result.current.error).toBeNull()
    expect(result.current.deletingId).toBeNull()
  })

  it("n'appelle pas l'Api si la confirmation est refusée", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteVisite(onDeleted))

    await act(async () => {
      await result.current.handleDelete(visite)
    })

    expect(deleteVisiteMock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it("expose un message d'erreur en cas d'échec et n'appelle pas onDeleted", async () => {
    deleteVisiteMock.mockRejectedValue(
      new ApiError(500, 'Erreur serveur', 'La visite est introuvable.'),
    )
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteVisite(onDeleted))

    await act(async () => {
      await result.current.handleDelete(visite)
    })

    expect(onDeleted).not.toHaveBeenCalled()
    expect(result.current.error).toBe('La visite est introuvable.')
    expect(result.current.deletingId).toBeNull()
  })

  it("retombe sur le message par défaut si l'erreur n'est pas une ApiError", async () => {
    deleteVisiteMock.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useDeleteVisite(vi.fn()))

    await act(async () => {
      await result.current.handleDelete(visite)
    })

    await waitFor(() =>
      expect(result.current.error).toBe(
        'La suppression de la visite a échoué.',
      ),
    )
  })
})
