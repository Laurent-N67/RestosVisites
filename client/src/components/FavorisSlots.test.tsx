import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Restaurant, Utilisateur } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import FavorisSlots, { MAX_FAVORIS } from './FavorisSlots.tsx'

const { getMesFavorisMock, addFavoriMock, removeFavoriMock } = vi.hoisted(() => ({
  getMesFavorisMock: vi.fn(),
  addFavoriMock: vi.fn(),
  removeFavoriMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    getMesFavoris: getMesFavorisMock,
    addFavori: addFavoriMock,
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
  {
    id: 'restaurant-3',
    nom: 'La Trattoria',
    adresse: '3 rue de Turin',
    latitude: 45.07,
    longitude: 7.68,
    categories: [],
    description: null,
    telephone: null,
    siteWeb: null,
    horaires: null,
    photos: [],
  },
]

function makeRestaurant(id: string, nom: string): Restaurant {
  return {
    id,
    nom,
    adresse: `Adresse ${nom}`,
    latitude: 45,
    longitude: 5,
    categories: [],
    description: null,
    telephone: null,
    siteWeb: null,
    horaires: null,
    photos: [],
  }
}

function renderSlots(restaurantsList: Restaurant[] = restaurants) {
  return render(
    <MemoryRouter>
      <FavorisProvider>
        <FavorisSlots restaurants={restaurantsList} />
      </FavorisProvider>
    </MemoryRouter>,
  )
}

describe('FavorisSlots', () => {
  beforeEach(() => {
    getMesFavorisMock.mockReset()
    addFavoriMock.mockReset()
    removeFavoriMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it(`affiche toujours exactement ${MAX_FAVORIS} emplacements`, async () => {
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
      { restaurantId: 'restaurant-2', dateAjout: '2026-06-02' },
    ])
    renderSlots()

    await screen.findByText('Le Bon Coin')

    expect(document.querySelectorAll('.favoris-slot').length).toBe(MAX_FAVORIS)
  })

  it(`ne dépasse jamais ${MAX_FAVORIS} emplacements même avec des données incohérentes (plus de favoris que le plafond)`, async () => {
    // 8 restaurants distincts tous en favoris (plus que MAX_FAVORIS=6) : ne
    // devrait pas arriver via le flux normal (le backend bloque tout ajout
    // au-delà de 6), mais une donnée incohérente ne doit jamais faire
    // déborder la grille au-delà de ses emplacements fixes.
    const manyRestaurants = Array.from({ length: 8 }, (_, i) =>
      makeRestaurant(`restaurant-${i + 1}`, `Restaurant ${i + 1}`),
    )
    getMesFavorisMock.mockResolvedValue(
      manyRestaurants.map((r) => ({ restaurantId: r.id, dateAjout: '2026-06-01' })),
    )
    renderSlots(manyRestaurants)

    await screen.findByText('Restaurant 1')

    expect(document.querySelectorAll('.favoris-slot').length).toBe(MAX_FAVORIS)
    expect(document.querySelectorAll('.favoris-slot--filled').length).toBe(
      MAX_FAVORIS,
    )
  })

  it('distingue les emplacements remplis des emplacements vides', async () => {
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
      { restaurantId: 'restaurant-2', dateAjout: '2026-06-02' },
    ])
    renderSlots()

    await screen.findByText('Le Bon Coin')
    expect(screen.getByText('Chez Mario')).toBeInTheDocument()

    expect(document.querySelectorAll('.favoris-slot--filled').length).toBe(2)
    expect(document.querySelectorAll('.favoris-slot--empty').length).toBe(
      MAX_FAVORIS - 2,
    )
  })

  it('retire un favori via toggle au clic sur le bouton de retrait', async () => {
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    removeFavoriMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderSlots()

    await screen.findByText('Le Bon Coin')

    await user.click(
      screen.getByRole('button', { name: 'Retirer Le Bon Coin des favoris' }),
    )

    await waitFor(() =>
      expect(removeFavoriMock).toHaveBeenCalledWith('restaurant-1'),
    )
    await waitFor(() =>
      expect(screen.queryByText('Le Bon Coin')).not.toBeInTheDocument(),
    )
    expect(document.querySelectorAll('.favoris-slot--empty').length).toBe(
      MAX_FAVORIS,
    )
  })

  it('ajoute un favori via la popover de recherche (onSelect)', async () => {
    getMesFavorisMock.mockResolvedValue([
      { restaurantId: 'restaurant-1', dateAjout: '2026-06-01' },
    ])
    addFavoriMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderSlots()

    await screen.findByText('Le Bon Coin')

    const addButtons = screen.getAllByRole('button', { name: 'Ajouter un favori' })
    await user.click(addButtons[0])

    const input = await screen.findByPlaceholderText(
      'Rechercher un restaurant, ville, cuisine…',
    )
    await user.type(input, 'Trattoria')

    await user.click(await screen.findByRole('button', { name: /La Trattoria/ }))

    await waitFor(() =>
      expect(addFavoriMock).toHaveBeenCalledWith('restaurant-3'),
    )
    expect(await screen.findByText('La Trattoria')).toBeInTheDocument()
    // La popover de recherche se referme après l'ajout.
    expect(
      screen.queryByPlaceholderText('Rechercher un restaurant, ville, cuisine…'),
    ).not.toBeInTheDocument()
  })
})
