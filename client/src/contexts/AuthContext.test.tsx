import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Utilisateur } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { AuthProvider, useAuth } from './AuthContext.tsx'

const { getMeMock, loginMock, registerMock, logoutMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    getMe: getMeMock,
    login: loginMock,
    register: registerMock,
    logout: logoutMock,
  }
})

const utilisateur: Utilisateur = {
  id: 'user-1',
  email: 'user@example.com',
  nomAffiche: 'Une Personne',
  role: Role.Simple,
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    getMeMock.mockReset()
    loginMock.mockReset()
    registerMock.mockReset()
    logoutMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("charge l'utilisateur courant au montage quand la session est valide", async () => {
    getMeMock.mockResolvedValue(utilisateur)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toEqual(utilisateur)
  })

  it("traite un 401 comme non connecté, pas comme une erreur", async () => {
    getMeMock.mockRejectedValue(new ApiError(401, 'Non authentifié'))
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('login met à jour user après un appel réussi', async () => {
    getMeMock.mockRejectedValue(new ApiError(401, 'Non authentifié'))
    loginMock.mockResolvedValue(utilisateur)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login({ email: 'user@example.com', motDePasse: 'x' })
    })

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      motDePasse: 'x',
    })
    expect(result.current.user).toEqual(utilisateur)
  })

  it('register met à jour user après un appel réussi', async () => {
    getMeMock.mockRejectedValue(new ApiError(401, 'Non authentifié'))
    registerMock.mockResolvedValue(utilisateur)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.register({
        email: 'user@example.com',
        nomAffiche: 'Une Personne',
        motDePasse: 'x',
      })
    })

    expect(result.current.user).toEqual(utilisateur)
  })

  it('logout remet user à null après un appel réussi', async () => {
    getMeMock.mockResolvedValue(utilisateur)
    logoutMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.user).toEqual(utilisateur))

    await act(async () => {
      await result.current.logout()
    })

    expect(logoutMock).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
  })
})
