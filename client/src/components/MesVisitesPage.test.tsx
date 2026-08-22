import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Compagnie, Role } from '../api/types.ts'
import MesVisitesPage from './MesVisitesPage.tsx'

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
    commentaire: 'Très bon accueil',
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
    avecQui: Compagnie.Couple,
    reservation: null,
    budget: 40,
    tempsAttente: 15,
  },
  {
    id: 'visite-2',
    restaurantId: 'restaurant-2',
    date: '2026-07-10',
    note: 2,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
    avecQui: Compagnie.Amis,
    reservation: null,
    budget: null,
    tempsAttente: 5,
  },
  {
    id: 'visite-3',
    restaurantId: 'restaurant-1',
    date: '2026-06-01',
    note: 5,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'user-2',
    utilisateurNomAffiche: 'Une Autre Personne',
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <MesVisitesPage
        restaurants={restaurants}
        visites={visites}
        onEditVisite={vi.fn()}
        onVisiteDeleted={vi.fn()}
      />
    </MemoryRouter>,
  )
}

function cardTitles() {
  return screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)
}

describe('MesVisitesPage', () => {
  it("affiche le journal des visites de l'utilisateur connecté, trié du plus récent au plus ancien par défaut", () => {
    renderPage()

    expect(screen.getByText('Mes visites')).toBeInTheDocument()
    expect(screen.getByText('2 visites')).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Chez Mario', 'Le Bon Coin'])
    // La visite de restaurant-1 par un autre utilisateur (visite-3) ne fait
    // pas partie du journal personnel, mais compte dans la moyenne du
    // restaurant affichée sur la carte.
    expect(screen.getByText('(2 avis)')).toBeInTheDocument()
  })

  it('filtre par recherche sur le nom du restaurant', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByPlaceholderText('Rechercher un restaurant…'),
      'Bon Coin',
    )

    expect(cardTitles()).toEqual(['Le Bon Coin'])
    expect(screen.queryByText('Chez Mario')).not.toBeInTheDocument()
  })

  it('filtre par note minimale de la visite', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(screen.getByLabelText('Note'), '3')

    // visite-2 (Chez Mario, note 2) est exclue, visite-1 (Le Bon Coin, note 4) reste.
    expect(cardTitles()).toEqual(['Le Bon Coin'])
  })

  it('trie les visites (plus anciennes en premier)', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(screen.getByLabelText('Trier'), 'ancien')

    expect(cardTitles()).toEqual(['Le Bon Coin', 'Chez Mario'])
  })

  it("affiche un message quand aucune visite n'est enregistrée", () => {
    render(
      <MemoryRouter>
        <MesVisitesPage
          restaurants={restaurants}
          visites={[]}
          onEditVisite={vi.fn()}
          onVisiteDeleted={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Aucune visite enregistrée pour le moment.'),
    ).toBeInTheDocument()
  })

  it('affiche les détails clés (date, attente, type, budget) sur une carte', () => {
    renderPage()

    const title = screen.getByText('Le Bon Coin')
    const card = title.closest('article') as HTMLElement
    expect(within(card).getByText('01/07/2026')).toBeInTheDocument()
    expect(within(card).getByText('15 min')).toBeInTheDocument()
    expect(within(card).getByText('Couple')).toBeInTheDocument()
    expect(within(card).getByText('40 €')).toBeInTheDocument()
    expect(within(card).getByText('Très bon accueil')).toBeInTheDocument()
  })
})
