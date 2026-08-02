import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Utilisateur, UtilisateurAvecFavoris } from '../api/types.ts'
import { Role } from '../api/types.ts'
import UtilisateursPage from './UtilisateursPage.tsx'

const { getUtilisateursAvecFavorisMock, changerRoleMock } = vi.hoisted(() => ({
  getUtilisateursAvecFavorisMock: vi.fn(),
  changerRoleMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    getUtilisateursAvecFavoris: getUtilisateursAvecFavorisMock,
    changerRole: changerRoleMock,
  }
})

let currentUser: Utilisateur

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: currentUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const utilisateurs: UtilisateurAvecFavoris[] = [
  {
    id: 'user-1',
    email: 'simple@example.com',
    nomAffiche: 'Une Personne',
    role: Role.Simple,
    favoris: [
      { restaurantId: 'restaurant-1', restaurantNom: 'Le Bon Coin', dateAjout: '2026-06-01' },
    ],
  },
  {
    id: 'user-2',
    email: 'admin@example.com',
    nomAffiche: 'Une Admin',
    role: Role.Admin,
    favoris: [],
  },
]

describe('UtilisateursPage', () => {
  beforeEach(() => {
    getUtilisateursAvecFavorisMock.mockReset()
    changerRoleMock.mockReset()
    currentUser = {
      id: 'user-2',
      email: 'admin@example.com',
      nomAffiche: 'Une Admin',
      role: Role.Admin,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche la liste des utilisateurs avec leurs favoris', async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    render(<UtilisateursPage />)

    expect(await screen.findByText('Une Personne')).toBeInTheDocument()
    expect(screen.getByText(/Le Bon Coin/)).toBeInTheDocument()
    expect(screen.getByText('Une Admin')).toBeInTheDocument()
    expect(screen.getByText('Aucun favori.')).toBeInTheDocument()
  })

  it('affiche un sélecteur de rôle pour un admin et permet de changer un rôle', async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    changerRoleMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<UtilisateursPage />)

    await screen.findByText('Une Personne')
    const selects = screen.getAllByLabelText('Rôle')
    expect(selects).toHaveLength(2)

    await user.selectOptions(selects[0], 'Admin')

    await waitFor(() =>
      expect(changerRoleMock).toHaveBeenCalledWith('user-1', Role.Admin),
    )
  })

  it("masque le sélecteur de rôle pour un utilisateur non-admin", async () => {
    currentUser = {
      id: 'user-1',
      email: 'simple@example.com',
      nomAffiche: 'Une Personne',
      role: Role.Simple,
    }
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    render(<UtilisateursPage />)

    await screen.findByText('Une Personne')
    expect(screen.queryByLabelText('Rôle')).not.toBeInTheDocument()
    expect(screen.getAllByText('Simple').length).toBeGreaterThan(0)
  })

  it("affiche une erreur si le chargement échoue", async () => {
    getUtilisateursAvecFavorisMock.mockRejectedValue(
      new ApiError(500, 'Erreur serveur', 'Impossible de charger les utilisateurs.'),
    )
    render(<UtilisateursPage />)

    expect(
      await screen.findByText('Impossible de charger les utilisateurs.'),
    ).toBeInTheDocument()
  })
})
