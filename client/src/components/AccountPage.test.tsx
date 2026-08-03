import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Utilisateur } from '../api/types.ts'
import { Role } from '../api/types.ts'
import AccountPage from './AccountPage.tsx'

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  )
}

const { changerNomAfficheMock, changerMotDePasseMock, supprimerMonCompteMock } =
  vi.hoisted(() => ({
    changerNomAfficheMock: vi.fn(),
    changerMotDePasseMock: vi.fn(),
    supprimerMonCompteMock: vi.fn(),
  }))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    changerNomAffiche: changerNomAfficheMock,
    changerMotDePasse: changerMotDePasseMock,
    supprimerMonCompte: supprimerMonCompteMock,
  }
})

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    )
  return { ...actual, useNavigate: () => navigateMock }
})

let currentUser: Utilisateur
const refreshMock = vi.fn()
const clearSessionMock = vi.fn()

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: currentUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: refreshMock,
    clearSession: clearSessionMock,
  }),
}))

describe('AccountPage', () => {
  beforeEach(() => {
    changerNomAfficheMock.mockReset()
    changerMotDePasseMock.mockReset()
    supprimerMonCompteMock.mockReset()
    navigateMock.mockReset()
    refreshMock.mockReset()
    clearSessionMock.mockReset()
    currentUser = {
      id: 'user-1',
      email: 'simple@example.com',
      nomAffiche: 'Une Personne',
      role: Role.Simple,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('pré-remplit le champ nom affiché avec le nom courant', () => {
    renderPage()

    expect(screen.getByLabelText('Nom affiché')).toHaveValue('Une Personne')
  })

  it("change le nom affiché et déclenche un rafraîchissement du contexte", async () => {
    changerNomAfficheMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const champ = screen.getByLabelText('Nom affiché')
    await user.clear(champ)
    await user.type(champ, 'Nouveau Nom')
    await user.click(screen.getAllByRole('button', { name: 'Mettre à jour' })[0])

    await waitFor(() =>
      expect(changerNomAfficheMock).toHaveBeenCalledWith('Nouveau Nom'),
    )
    await waitFor(() => expect(refreshMock).toHaveBeenCalled())
    expect(
      await screen.findByText('Nom affiché mis à jour avec succès.'),
    ).toBeInTheDocument()
  })

  it("bloque la soumission du nouveau mot de passe tant que la politique n'est pas respectée", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByLabelText('Mot de passe actuel'),
      'AncienMotDePasse123!',
    )
    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'faible')
    expect(screen.getByText('Au moins 12 caractères.')).toBeInTheDocument()

    const boutonsMettreAJour = screen.getAllByRole('button', {
      name: 'Mettre à jour',
    })
    await user.click(boutonsMettreAJour[1])

    expect(
      screen.getByText(
        'Le mot de passe ne respecte pas encore toutes les règles ci-dessous.',
      ),
    ).toBeInTheDocument()
    expect(changerMotDePasseMock).not.toHaveBeenCalled()
  })

  it('change le mot de passe et affiche un message de succès', async () => {
    changerMotDePasseMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByLabelText('Mot de passe actuel'),
      'AncienMotDePasse123!',
    )
    await user.type(
      screen.getByLabelText('Nouveau mot de passe'),
      'NouveauMotDePasse123!',
    )

    const boutonsMettreAJour = screen.getAllByRole('button', {
      name: 'Mettre à jour',
    })
    await user.click(boutonsMettreAJour[1])

    await waitFor(() =>
      expect(changerMotDePasseMock).toHaveBeenCalledWith(
        'AncienMotDePasse123!',
        'NouveauMotDePasse123!',
      ),
    )
    expect(
      await screen.findByText('Mot de passe mis à jour avec succès.'),
    ).toBeInTheDocument()
  })

  it("affiche une erreur si le changement de mot de passe échoue (ex. mot de passe actuel incorrect) sans effacer les champs silencieusement", async () => {
    changerMotDePasseMock.mockRejectedValue(
      new ApiError(401, 'Non autorisé', 'Mot de passe actuel incorrect.'),
    )
    const user = userEvent.setup()
    renderPage()

    const champActuel = screen.getByLabelText('Mot de passe actuel')
    const champNouveau = screen.getByLabelText('Nouveau mot de passe')
    await user.type(champActuel, 'MauvaisMotDePasse123!')
    await user.type(champNouveau, 'NouveauMotDePasse123!')

    const boutonsMettreAJour = screen.getAllByRole('button', {
      name: 'Mettre à jour',
    })
    await user.click(boutonsMettreAJour[1])

    expect(
      await screen.findByText('Mot de passe actuel incorrect.'),
    ).toBeInTheDocument()
    expect(champActuel).toHaveValue('MauvaisMotDePasse123!')
    expect(champNouveau).toHaveValue('NouveauMotDePasse123!')
  })

  it("n'appelle pas l'Api si la confirmation de suppression du compte est refusée", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Supprimer mon compte' }),
    )

    expect(supprimerMonCompteMock).not.toHaveBeenCalled()
    expect(clearSessionMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('supprime le compte après confirmation, efface la session et redirige vers l\'accueil', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    supprimerMonCompteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Supprimer mon compte' }),
    )

    await waitFor(() => expect(supprimerMonCompteMock).toHaveBeenCalled())
    await waitFor(() => expect(clearSessionMock).toHaveBeenCalled())
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/'))
  })

  it("affiche une erreur si la suppression du compte échoue sans naviguer", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    supprimerMonCompteMock.mockRejectedValue(
      new ApiError(422, 'Erreur', 'Impossible de supprimer le dernier compte Admin.'),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Supprimer mon compte' }),
    )

    expect(
      await screen.findByText('Impossible de supprimer le dernier compte Admin.'),
    ).toBeInTheDocument()
    expect(clearSessionMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
