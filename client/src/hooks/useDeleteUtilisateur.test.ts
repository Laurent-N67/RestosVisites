import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { UtilisateurAvecFavoris } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useDeleteUtilisateur } from './useDeleteUtilisateur.ts'

const { supprimerUtilisateurMock } = vi.hoisted(() => ({
  supprimerUtilisateurMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>(
      '../api/client.ts',
    )
  return { ...actual, supprimerUtilisateur: supprimerUtilisateurMock }
})

const utilisateur: UtilisateurAvecFavoris = {
  id: 'user-1',
  email: 'simple@example.com',
  nomAffiche: 'Une Personne',
  role: Role.Simple,
  favoris: [],
}

describe('useDeleteUtilisateur', () => {
  beforeEach(() => {
    supprimerUtilisateurMock.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('demande confirmation avec un message explicite', async () => {
    supprimerUtilisateurMock.mockResolvedValue(undefined)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { result } = renderHook(() => useDeleteUtilisateur(vi.fn()))

    await act(async () => {
      await result.current.handleDelete(utilisateur)
    })

    expect(confirmSpy).toHaveBeenCalledWith(
      'Supprimer le compte de "Une Personne" et toutes ses visites ?',
    )
  })

  it('supprime l\'utilisateur et appelle onDeleted', async () => {
    supprimerUtilisateurMock.mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteUtilisateur(onDeleted))

    await act(async () => {
      await result.current.handleDelete(utilisateur)
    })

    expect(supprimerUtilisateurMock).toHaveBeenCalledWith('user-1')
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it("n'appelle pas l'Api si la confirmation est refusée", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteUtilisateur(onDeleted))

    await act(async () => {
      await result.current.handleDelete(utilisateur)
    })

    expect(supprimerUtilisateurMock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(result.current.deleting).toBe(false)
  })

  it("expose un message d'erreur et réinitialise l'état deleting en cas d'échec", async () => {
    supprimerUtilisateurMock.mockRejectedValue(
      new ApiError(422, 'Erreur', "Impossible de supprimer le dernier compte Admin."),
    )
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteUtilisateur(onDeleted))

    await act(async () => {
      await result.current.handleDelete(utilisateur)
    })

    expect(onDeleted).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      'Impossible de supprimer le dernier compte Admin.',
    )
    expect(result.current.deleting).toBe(false)
  })

  it("retombe sur le message par défaut si l'erreur n'est pas une ApiError", async () => {
    supprimerUtilisateurMock.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useDeleteUtilisateur(vi.fn()))

    await act(async () => {
      await result.current.handleDelete(utilisateur)
    })

    expect(result.current.error).toBe(
      "La suppression de l'utilisateur a échoué.",
    )
  })
})
