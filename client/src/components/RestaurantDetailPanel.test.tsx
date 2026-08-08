import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import RestaurantDetailPanel from './RestaurantDetailPanel.tsx'
import type { VisitesState } from './RestaurantMarker.tsx'

const {
  deleteRestaurantMock,
  deleteVisiteMock,
  getMesFavorisMock,
  addFavoriMock,
  removeFavoriMock,
} = vi.hoisted(() => ({
  deleteRestaurantMock: vi.fn(),
  deleteVisiteMock: vi.fn(),
  getMesFavorisMock: vi.fn(),
  addFavoriMock: vi.fn(),
  removeFavoriMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>(
      '../api/client.ts',
    )
  return {
    ...actual,
    deleteRestaurant: deleteRestaurantMock,
    deleteVisite: deleteVisiteMock,
    getMesFavoris: getMesFavorisMock,
    addFavori: addFavoriMock,
    removeFavori: removeFavoriMock,
  }
})

let currentUser: Utilisateur | null = null

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

const adminUser: Utilisateur = {
  id: 'admin-1',
  email: 'admin@example.com',
  nomAffiche: 'Admin',
  role: Role.Admin,
}

const simpleUser: Utilisateur = {
  id: 'user-1',
  email: 'user1@example.com',
  nomAffiche: 'Utilisateur',
  role: Role.Simple,
}

const restaurant: Restaurant = {
  id: 'restaurant-1',
  nom: 'Le Bon Coin',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [{ id: 'cat-1', nom: 'Italien', groupe: 'Type de cuisine' }],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

const visites: Visite[] = [
  {
    id: 'visite-1',
    restaurantId: 'restaurant-1',
    date: '2026-07-01',
    note: 4,
    commentaire: 'Très bon',
    urlsPhotos: [],
    utilisateurId: 'user-2',
    utilisateurNomAffiche: 'Une Autre Personne',
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
  },
  {
    id: 'visite-2',
    restaurantId: 'restaurant-1',
    date: '2026-08-01',
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

const loadedVisitesState: VisitesState = { status: 'loaded', visites }

function renderPanel(
  props: Partial<React.ComponentProps<typeof RestaurantDetailPanel>> = {},
) {
  const defaultProps: React.ComponentProps<typeof RestaurantDetailPanel> = {
    restaurant,
    visitesState: loadedVisitesState,
    utilisateursAvecFavoris: [],
    onClose: vi.fn(),
    onEditRestaurant: vi.fn(),
    onRestaurantDeleted: vi.fn(),
    onEditVisite: vi.fn(),
    onVisitesRefresh: vi.fn(),
    onVisiteDeleted: vi.fn(),
    onAddVisite: vi.fn(),
  }
  return render(
    <FavorisProvider>
      <RestaurantDetailPanel {...defaultProps} {...props} />
    </FavorisProvider>,
  )
}

describe('RestaurantDetailPanel', () => {
  beforeEach(() => {
    currentUser = adminUser
    deleteRestaurantMock.mockReset()
    deleteVisiteMock.mockReset()
    getMesFavorisMock.mockReset()
    addFavoriMock.mockReset()
    removeFavoriMock.mockReset()
    getMesFavorisMock.mockResolvedValue([])
    addFavoriMock.mockResolvedValue(undefined)
    removeFavoriMock.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche les informations du restaurant', () => {
    renderPanel()

    expect(
      screen.getByRole('heading', { name: 'Le Bon Coin' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 rue de Paris')).toBeInTheDocument()
    expect(screen.getByText('Italien')).toBeInTheDocument()
  })

  it("affiche l'historique des visites via VisitesSection, la plus récente d'abord", () => {
    renderPanel()

    const dates = screen.getAllByText(/^\d{2}\/\d{2}\/2026$/)
    expect(dates.map((d) => d.textContent)).toEqual(['01/08/2026', '01/07/2026'])
  })

  it("bascule le favori via useFavoriToggle", async () => {
    const user = userEvent.setup()
    renderPanel()

    const toggle = screen.getByRole('button', { name: 'Ajouter Le Bon Coin aux favoris' })
    await user.click(toggle)

    expect(
      await screen.findByRole('button', { name: 'Retirer Le Bon Coin des favoris' }),
    ).toBeInTheDocument()
  })

  it('affiche les actions Modifier/Supprimer uniquement pour un admin', () => {
    currentUser = simpleUser
    renderPanel()

    expect(
      screen.queryByRole('button', { name: 'Modifier' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Supprimer' }),
    ).not.toBeInTheDocument()
  })

  it('affiche les actions Modifier/Supprimer pour un admin', () => {
    renderPanel()

    // Une pour le restaurant, une par visite (2 visites) = 3. Le bouton
    // "Supprimer" du restaurant est désormais le lien discret "Supprimer ce
    // restaurant" (cf. `detail-panel-delete-link`), d'où le matcher par
    // préfixe plutôt qu'un nom exact.
    expect(screen.getAllByRole('button', { name: 'Modifier' }).length).toBe(3)
    expect(screen.getAllByRole('button', { name: /^Supprimer/ }).length).toBe(3)
  })

  it('supprime le restaurant, notifie le parent et ferme le panneau', async () => {
    deleteRestaurantMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const onRestaurantDeleted = vi.fn()
    const onClose = vi.fn()
    renderPanel({ onRestaurantDeleted, onClose })

    await user.click(screen.getByRole('button', { name: 'Supprimer ce restaurant' }))

    await waitFor(() =>
      expect(deleteRestaurantMock).toHaveBeenCalledWith('restaurant-1'),
    )
    expect(onRestaurantDeleted).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('déclenche onAddVisite avec l\'id du restaurant sélectionné', async () => {
    const user = userEvent.setup()
    const onAddVisite = vi.fn()
    renderPanel({ onAddVisite })

    await user.click(
      screen.getByRole('button', { name: '+ Ajouter une visite' }),
    )

    expect(onAddVisite).toHaveBeenCalledWith('restaurant-1')
  })

  it('déclenche onClose au clic sur le bouton de fermeture', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderPanel({ onClose })

    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("n'affiche pas de section visites tant qu'elles ne sont pas chargées (statut idle)", () => {
    renderPanel({ visitesState: { status: 'idle' } })

    expect(screen.queryByText(/^\d{2}\/\d{2}\/2026$/)).not.toBeInTheDocument()
  })
})
