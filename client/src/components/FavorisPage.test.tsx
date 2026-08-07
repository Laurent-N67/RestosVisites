import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import FavorisPage from './FavorisPage.tsx'

const { getMesFavorisMock, removeFavoriMock } = vi.hoisted(() => ({
  getMesFavorisMock: vi.fn(),
  removeFavoriMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    getMesFavoris: getMesFavorisMock,
    removeFavori: removeFavoriMock,
  }
})

const loggedInUser: Utilisateur = {
  id: 'user-1',
  email: 'user@example.com',
  nomAffiche: 'Une Personne',
  role: Role.Simple,
}

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: loggedInUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const restaurants: Restaurant[] = [
  {
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
  },
  {
    id: 'restaurant-2',
    nom: 'Chez Mario',
    adresse: '2 rue de Rome',
    latitude: 45.75,
    longitude: 4.85,
    categories: [],
    description: null,
    telephone: null,
    siteWeb: null,
    horaires: null,
    photos: [],
  },
]

const visites: Visite[] = [
  {
    id: 'visite-1',
    restaurantId: 'restaurant-1',
    date: '2026-07-01',
    note: 4,
    commentaire: 'Très bon',
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <FavorisProvider>
        <FavorisPage restaurants={restaurants} visites={visites} />
      </FavorisProvider>
    </MemoryRouter>,
  )
}

describe('FavorisPage', () => {
  beforeEach(() => {
    getMesFavorisMock.mockReset()
    removeFavoriMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("affiche les restaurants favoris avec leur historique de visites", async () => {
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    renderPage()

    expect(await screen.findByText('Le Bon Coin')).toBeInTheDocument()
    expect(screen.getByText('Très bon')).toBeInTheDocument()
    expect(screen.queryByText('Chez Mario')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 6 favoris')).toBeInTheDocument()
  })

  it("affiche un message quand aucun favori n'est enregistré", async () => {
    getMesFavorisMock.mockResolvedValue([])
    renderPage()

    expect(
      await screen.findByText('Aucun restaurant favori pour le moment.'),
    ).toBeInTheDocument()
  })

  it("affiche une erreur si le chargement des favoris échoue", async () => {
    getMesFavorisMock.mockRejectedValue(
      new ApiError(500, 'Erreur serveur', 'Impossible de charger vos favoris.'),
    )
    renderPage()

    expect(
      await screen.findByText('Impossible de charger vos favoris.'),
    ).toBeInTheDocument()
  })

  it('retire un favori de la liste', async () => {
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    removeFavoriMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Le Bon Coin')
    await user.click(screen.getByRole('button', { name: '★ Retirer' }))

    await waitFor(() => expect(removeFavoriMock).toHaveBeenCalledWith('restaurant-1'))
    await waitFor(() =>
      expect(screen.queryByText('Le Bon Coin')).not.toBeInTheDocument(),
    )
  })

  it('affiche une section "Recommandé pour vous" pour un restaurant de style similaire pas encore visité', async () => {
    const italien = { id: 'cat-italien', nom: 'Italien', groupe: 'Type de cuisine' }
    const restaurantsAvecCategories: Restaurant[] = [
      { ...restaurants[0], categories: [italien] },
      { ...restaurants[1], categories: [italien] },
    ]
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])

    render(
      <MemoryRouter>
        <FavorisProvider>
          <FavorisPage restaurants={restaurantsAvecCategories} visites={visites} />
        </FavorisProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Recommandé pour vous')).toBeInTheDocument()
    expect(screen.getByText('Chez Mario')).toBeInTheDocument()
  })
})
