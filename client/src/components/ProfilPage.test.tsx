import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import ProfilPage from './ProfilPage.tsx'

const visites: Visite[] = [
  {
    id: 'v1',
    restaurantId: 'resto-1',
    date: '2026-01-01',
    note: 5,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
  },
  {
    id: 'v2',
    restaurantId: 'resto-1',
    date: '2026-02-01',
    note: 4,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
  },
  {
    id: 'v3',
    restaurantId: 'resto-2',
    date: '2026-02-02',
    note: 3,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'autre-utilisateur',
    utilisateurNomAffiche: 'Quelqu\'un d\'autre',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <FavorisProvider>
        <ProfilPage visites={visites} />
      </FavorisProvider>
    </MemoryRouter>,
  )
}

const { changerNomAfficheMock, changerMotDePasseMock, supprimerMonCompteMock, getMesFavorisMock } =
  vi.hoisted(() => ({
    changerNomAfficheMock: vi.fn(),
    changerMotDePasseMock: vi.fn(),
    supprimerMonCompteMock: vi.fn(),
    getMesFavorisMock: vi.fn(),
  }))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    changerNomAffiche: changerNomAfficheMock,
    changerMotDePasse: changerMotDePasseMock,
    supprimerMonCompte: supprimerMonCompteMock,
    getMesFavoris: getMesFavorisMock,
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

describe('ProfilPage', () => {
  beforeEach(() => {
    changerNomAfficheMock.mockReset()
    changerMotDePasseMock.mockReset()
    supprimerMonCompteMock.mockReset()
    getMesFavorisMock.mockReset()
    getMesFavorisMock.mockResolvedValue([{ restaurantId: 'resto-1', dateAjout: '2026-01-01' }])
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

  it("affiche le nom, l'email et les statistiques personnelles de l'utilisateur", async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Une Personne' })).toBeInTheDocument()
    expect(screen.getByText('simple@example.com')).toBeInTheDocument()
    // 2 visites sur resto-1 par user-1, 0 sur resto-2 (visite de quelqu'un d'autre) : 1 restaurant, 2 visites.
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Favoris')).toBeInTheDocument())
  })

  it("n'affiche pas la section administration pour un utilisateur simple", () => {
    renderPage()

    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
  })

  it('affiche la section administration pour un administrateur', () => {
    currentUser = { ...currentUser, role: Role.Admin }
    renderPage()

    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Statistiques globales' })).toBeInTheDocument()
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
