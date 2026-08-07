import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import VisitesJournalPage from './VisitesJournalPage.tsx'

const { deleteVisiteMock } = vi.hoisted(() => ({
  deleteVisiteMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    deleteVisite: deleteVisiteMock,
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

function makeVisite(overrides: Partial<Visite>): Visite {
  return {
    id: 'visite-x',
    restaurantId: 'restaurant-1',
    date: '2026-01-01',
    note: 4,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
    ...overrides,
  }
}

function renderPage(visites: Visite[], restaurantsList: Restaurant[] = restaurants) {
  return render(
    <MemoryRouter>
      <VisitesJournalPage
        restaurants={restaurantsList}
        visites={visites}
        onEditVisite={vi.fn()}
        onVisiteDeleted={vi.fn()}
      />
    </MemoryRouter>,
  )
}

describe('VisitesJournalPage', () => {
  beforeEach(() => {
    deleteVisiteMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche les visites de l’utilisateur connecté triées de la plus récente à la plus ancienne', () => {
    const visites = [
      makeVisite({
        id: 'visite-ancienne',
        restaurantId: 'restaurant-1',
        date: '2026-01-01',
      }),
      makeVisite({
        id: 'visite-recente',
        restaurantId: 'restaurant-2',
        date: '2026-06-15',
      }),
    ]
    renderPage(visites)

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(['Chez Mario', 'Le Bon Coin'])
  })

  it("n'affiche que les visites de l'utilisateur connecté (pas celles des autres)", () => {
    const visites = [
      makeVisite({ id: 'visite-moi', restaurantId: 'restaurant-1', utilisateurId: 'user-1' }),
      makeVisite({
        id: 'visite-autre',
        restaurantId: 'restaurant-2',
        utilisateurId: 'user-2',
        utilisateurNomAffiche: 'Une Autre Personne',
      }),
    ]
    renderPage(visites)

    expect(screen.getByText('Le Bon Coin')).toBeInTheDocument()
    expect(screen.queryByText('Chez Mario')).not.toBeInTheDocument()
  })

  it("affiche un message quand l'utilisateur n'a encore enregistré aucune visite", () => {
    renderPage([])

    expect(
      screen.getByText("Vous n'avez pas encore enregistré de visite."),
    ).toBeInTheDocument()
  })

  it('associe chaque visite à son restaurant (nom affiché + lien vers la fiche)', () => {
    const visites = [makeVisite({ id: 'visite-1', restaurantId: 'restaurant-2' })]
    renderPage(visites)

    const link = screen.getByRole('link', { name: 'Chez Mario' })
    expect(link).toHaveAttribute('href', '/restaurants/restaurant-2')
  })

  it("ignore silencieusement une visite dont le restaurant n'existe plus", () => {
    const visites = [
      makeVisite({ id: 'visite-orpheline', restaurantId: 'restaurant-inconnu' }),
    ]
    renderPage(visites)

    expect(
      screen.getByText("Vous n'avez pas encore enregistré de visite."),
    ).toBeInTheDocument()
  })

  it('affiche le chip "avec qui" quand il est renseigné, et rien sinon', () => {
    const visites = [
      makeVisite({ id: 'visite-1', restaurantId: 'restaurant-1', avecQui: 1 }),
    ]
    renderPage(visites)

    expect(screen.getByText('Couple')).toBeInTheDocument()
  })

  it('n\'affiche aucun chip "avec qui" quand il vaut null', () => {
    const visites = [
      makeVisite({ id: 'visite-1', restaurantId: 'restaurant-1', avecQui: null }),
    ]
    renderPage(visites)

    expect(screen.queryByText('Seul')).not.toBeInTheDocument()
    expect(screen.queryByText('Couple')).not.toBeInTheDocument()
    expect(screen.queryByText('Amis')).not.toBeInTheDocument()
    expect(screen.queryByText('Famille')).not.toBeInTheDocument()
  })

  it("utilise la photo de la visite en priorité, sinon la photo principale du restaurant, sinon sa première photo", () => {
    const restaurantsAvecPhotos: Restaurant[] = [
      {
        ...restaurants[0],
        photos: [
          { id: 'photo-1', url: 'restaurant-secondaire.jpg', estPrincipale: false, ordre: 0 },
          { id: 'photo-2', url: 'restaurant-principale.jpg', estPrincipale: true, ordre: 1 },
        ],
      },
    ]

    // La photo de la visite prime sur celles du restaurant.
    const { unmount } = renderPage(
      [makeVisite({ id: 'v1', restaurantId: 'restaurant-1', urlsPhotos: ['visite.jpg'] })],
      restaurantsAvecPhotos,
    )
    expect(screen.getByAltText('Le Bon Coin')).toHaveAttribute('src', 'visite.jpg')
    unmount()

    // Sans photo de visite, la photo principale du restaurant est utilisée.
    const { unmount: unmount2 } = renderPage(
      [makeVisite({ id: 'v2', restaurantId: 'restaurant-1', urlsPhotos: [] })],
      restaurantsAvecPhotos,
    )
    expect(screen.getByAltText('Le Bon Coin')).toHaveAttribute(
      'src',
      'restaurant-principale.jpg',
    )
    unmount2()

    // Sans photo de visite ni photo principale, la première photo du restaurant est utilisée.
    const restaurantsSansPrincipale: Restaurant[] = [
      {
        ...restaurants[0],
        photos: [
          { id: 'photo-1', url: 'restaurant-premiere.jpg', estPrincipale: false, ordre: 0 },
        ],
      },
    ]
    renderPage(
      [makeVisite({ id: 'v3', restaurantId: 'restaurant-1', urlsPhotos: [] })],
      restaurantsSansPrincipale,
    )
    expect(screen.getByAltText('Le Bon Coin')).toHaveAttribute(
      'src',
      'restaurant-premiere.jpg',
    )
  })

  it('modifier une entrée appelle onEditVisite avec la visite correspondante', async () => {
    const onEditVisite = vi.fn()
    const visite = makeVisite({ id: 'visite-1', restaurantId: 'restaurant-1' })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <VisitesJournalPage
          restaurants={restaurants}
          visites={[visite]}
          onEditVisite={onEditVisite}
          onVisiteDeleted={vi.fn()}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Modifier' }))
    expect(onEditVisite).toHaveBeenCalledWith(visite)
  })

  it('supprimer une entrée après confirmation appelle deleteVisite puis onVisiteDeleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteVisiteMock.mockResolvedValue(undefined)
    const onVisiteDeleted = vi.fn()
    const visite = makeVisite({ id: 'visite-1', restaurantId: 'restaurant-1' })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <VisitesJournalPage
          restaurants={restaurants}
          visites={[visite]}
          onEditVisite={vi.fn()}
          onVisiteDeleted={onVisiteDeleted}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(deleteVisiteMock).toHaveBeenCalledWith('visite-1')
    await vi.waitFor(() => expect(onVisiteDeleted).toHaveBeenCalled())
  })

  it("n'appelle pas deleteVisite si la confirmation est refusée", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const visite = makeVisite({ id: 'visite-1', restaurantId: 'restaurant-1' })
    const user = userEvent.setup()

    renderPage([visite])

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(deleteVisiteMock).not.toHaveBeenCalled()
  })
})
