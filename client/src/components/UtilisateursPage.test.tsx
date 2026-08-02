import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Utilisateur, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import UtilisateursPage from './UtilisateursPage.tsx'

function renderPage(visites: Visite[] = []) {
  return render(
    <MemoryRouter>
      <UtilisateursPage visites={visites} />
    </MemoryRouter>,
  )
}

const { getUtilisateursAvecFavorisMock, changerRoleMock, reinitialiserMotDePasseMock } =
  vi.hoisted(() => ({
    getUtilisateursAvecFavorisMock: vi.fn(),
    changerRoleMock: vi.fn(),
    reinitialiserMotDePasseMock: vi.fn(),
  }))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    getUtilisateursAvecFavoris: getUtilisateursAvecFavorisMock,
    changerRole: changerRoleMock,
    reinitialiserMotDePasse: reinitialiserMotDePasseMock,
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
    reinitialiserMotDePasseMock.mockReset()
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
    renderPage()

    expect(await screen.findByText('Une Personne')).toBeInTheDocument()
    expect(screen.getByText(/Le Bon Coin/)).toBeInTheDocument()
    expect(screen.getByText('Une Admin')).toBeInTheDocument()
    expect(screen.getByText('Aucun favori.')).toBeInTheDocument()
  })

  it("affiche la note moyenne des visites du propriétaire du favori et un lien vers le restaurant", async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    const visites: Visite[] = [
      {
        id: 'v1',
        restaurantId: 'restaurant-1',
        date: '2026-06-05',
        note: 4,
        commentaire: null,
        urlsPhotos: [],
        utilisateurId: 'user-1',
        utilisateurNomAffiche: 'Une Personne',
      },
      {
        id: 'v2',
        restaurantId: 'restaurant-1',
        date: '2026-06-10',
        note: 2,
        commentaire: null,
        urlsPhotos: [],
        utilisateurId: 'user-1',
        utilisateurNomAffiche: 'Une Personne',
      },
    ]
    renderPage(visites)

    const lien = await screen.findByRole('link', { name: /Le Bon Coin/ })
    expect(lien).toHaveAttribute('href', '/restaurants/restaurant-1')
    expect(lien.textContent).toContain('(3.0)')
  })

  it('affiche un sélecteur de rôle pour un admin et permet de changer un rôle', async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    changerRoleMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

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
    renderPage()

    await screen.findByText('Une Personne')
    expect(screen.queryByLabelText('Rôle')).not.toBeInTheDocument()
    expect(screen.getAllByText('Utilisateur').length).toBeGreaterThan(0)
  })

  it("n'affiche pas l'email d'un utilisateur quand le backend le renvoie à null (masqué pour un non-admin)", async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue([
      { ...utilisateurs[0], email: null },
      utilisateurs[1],
    ])
    renderPage()

    await screen.findByText('Une Personne')
    expect(screen.queryByText('simple@example.com')).not.toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it("affiche une erreur si le chargement échoue", async () => {
    getUtilisateursAvecFavorisMock.mockRejectedValue(
      new ApiError(500, 'Erreur serveur', 'Impossible de charger les utilisateurs.'),
    )
    renderPage()

    expect(
      await screen.findByText('Impossible de charger les utilisateurs.'),
    ).toBeInTheDocument()
  })

  it('ouvre et ferme le formulaire de réinitialisation du mot de passe pour un utilisateur', async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Une Personne')
    const toggles = screen.getAllByRole('button', {
      name: 'Réinitialiser le mot de passe',
    })
    await user.click(toggles[0])

    expect(
      screen.getByLabelText('Nouveau mot de passe'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(
      screen.queryByLabelText('Nouveau mot de passe'),
    ).not.toBeInTheDocument()
  })

  it('bloque la soumission tant que le mot de passe ne respecte pas la politique', async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Une Personne')
    const toggles = screen.getAllByRole('button', {
      name: 'Réinitialiser le mot de passe',
    })
    await user.click(toggles[0])

    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'faible')
    expect(screen.getByText('Au moins 12 caractères.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(
      screen.getByText(
        'Le mot de passe ne respecte pas encore toutes les règles ci-dessous.',
      ),
    ).toBeInTheDocument()
    expect(reinitialiserMotDePasseMock).not.toHaveBeenCalled()
  })

  it('réinitialise le mot de passe et affiche un message de succès', async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    reinitialiserMotDePasseMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Une Personne')
    const toggles = screen.getAllByRole('button', {
      name: 'Réinitialiser le mot de passe',
    })
    await user.click(toggles[0])

    await user.type(
      screen.getByLabelText('Nouveau mot de passe'),
      'MotDePasse123!',
    )
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    await waitFor(() =>
      expect(reinitialiserMotDePasseMock).toHaveBeenCalledWith(
        'user-1',
        'MotDePasse123!',
      ),
    )
    expect(
      await screen.findByText('Mot de passe réinitialisé avec succès.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Nouveau mot de passe'),
    ).not.toBeInTheDocument()
  })

  it("affiche une erreur si la réinitialisation du mot de passe échoue", async () => {
    getUtilisateursAvecFavorisMock.mockResolvedValue(utilisateurs)
    reinitialiserMotDePasseMock.mockRejectedValue(
      new ApiError(422, 'Erreur', 'Le mot de passe ne respecte pas la politique.'),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Une Personne')
    const toggles = screen.getAllByRole('button', {
      name: 'Réinitialiser le mot de passe',
    })
    await user.click(toggles[0])

    await user.type(
      screen.getByLabelText('Nouveau mot de passe'),
      'MotDePasse123!',
    )
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(
      await screen.findByText('Le mot de passe ne respecte pas la politique.'),
    ).toBeInTheDocument()
  })
})
