import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import RestaurantsMap from './RestaurantsMap.tsx'
import '../leaflet-icon-fix.ts'

const {
  getVisitesMock,
  getMesFavorisMock,
  deleteRestaurantMock,
  deleteVisiteMock,
  addFavoriMock,
  removeFavoriMock,
} = vi.hoisted(() => ({
  getVisitesMock: vi.fn(),
  getMesFavorisMock: vi.fn(),
  deleteRestaurantMock: vi.fn(),
  deleteVisiteMock: vi.fn(),
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
    getVisites: getVisitesMock,
    getMesFavoris: getMesFavorisMock,
    deleteRestaurant: deleteRestaurantMock,
    deleteVisite: deleteVisiteMock,
    addFavori: addFavoriMock,
    removeFavori: removeFavoriMock,
  }
})

const adminUser: Utilisateur = {
  id: 'admin-1',
  email: 'admin@example.com',
  nomAffiche: 'Admin',
  role: Role.Admin,
}

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: adminUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const restaurantA: Restaurant = {
  id: 'restaurant-a',
  nom: 'Chez Aline',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

const restaurantB: Restaurant = {
  id: 'restaurant-b',
  nom: 'Le Petit Coin',
  adresse: '2 rue de Lyon',
  latitude: 45.75,
  longitude: 4.85,
  categories: [],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

const restaurants = [restaurantA, restaurantB]
const visites: Visite[] = []

function renderMap(
  props: Partial<React.ComponentProps<typeof RestaurantsMap>> = {},
) {
  const defaultProps: React.ComponentProps<typeof RestaurantsMap> = {
    theme: 'light',
    restaurants,
    visites,
    utilisateursAvecFavoris: [],
    visiteMutation: null,
    onEditRestaurant: vi.fn(),
    onEditVisite: vi.fn(),
    onRestaurantDeleted: vi.fn(),
    onVisiteDeleted: vi.fn(),
    onAddVisite: vi.fn(),
  }
  return render(
    <FavorisProvider>
      <RestaurantsMap {...defaultProps} {...props} />
    </FavorisProvider>,
  )
}

describe('RestaurantsMap', () => {
  beforeEach(() => {
    getVisitesMock.mockReset()
    getMesFavorisMock.mockReset()
    deleteRestaurantMock.mockReset()
    deleteVisiteMock.mockReset()
    addFavoriMock.mockReset()
    removeFavoriMock.mockReset()
    getVisitesMock.mockResolvedValue([])
    getMesFavorisMock.mockResolvedValue([])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("n'affiche pas de panneau de détail tant qu'aucun restaurant n'est sélectionné", () => {
    renderMap()

    expect(
      document.querySelector('.restaurant-detail-panel'),
    ).not.toBeInTheDocument()
  })

  it('sélectionne un restaurant et affiche le panneau de détail au clic dans la sidebar', async () => {
    const user = userEvent.setup()
    renderMap()

    await user.click(
      screen.getByRole('button', { name: /Chez Aline/ }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Chez Aline', level: 2 }),
    ).toBeInTheDocument()
  })

  it('sélectionne un restaurant et affiche le panneau de détail au clic sur son marqueur', async () => {
    const user = userEvent.setup()
    renderMap()

    const markers = document.querySelectorAll('.leaflet-marker-icon')
    expect(markers.length).toBe(2)
    // Les marqueurs sont rendus dans l'ordre du tableau `restaurants` passé
    // en props (pas trié), à la différence de la sidebar (triée par nom).
    await user.click(markers[1])

    expect(
      await screen.findByRole('heading', { name: 'Le Petit Coin', level: 2 }),
    ).toBeInTheDocument()
    await waitFor(() => expect(getVisitesMock).toHaveBeenCalledWith('restaurant-b'))
  })

  it('ferme le panneau de détail et efface la sélection au clic sur Fermer', async () => {
    const user = userEvent.setup()
    renderMap()

    await user.click(screen.getByRole('button', { name: /Chez Aline/ }))
    expect(
      await screen.findByRole('heading', { name: 'Chez Aline', level: 2 }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    await waitFor(() =>
      expect(
        document.querySelector('.restaurant-detail-panel'),
      ).not.toBeInTheDocument(),
    )
  })

  it('transmet onAddVisite avec l\'id du restaurant sélectionné', async () => {
    const user = userEvent.setup()
    const onAddVisite = vi.fn()
    renderMap({ onAddVisite })

    await user.click(screen.getByRole('button', { name: /Chez Aline/ }))
    await screen.findByRole('heading', { name: 'Chez Aline', level: 2 })

    await user.click(
      screen.getByRole('button', { name: '+ Ajouter une visite' }),
    )

    expect(onAddVisite).toHaveBeenCalledWith('restaurant-a')
  })

  it('affiche une vignette photo de couverture par restaurant dans la sidebar', () => {
    renderMap()

    const items = document.querySelectorAll('.map-sidebar-item-thumb')
    expect(items.length).toBe(2)
  })

  it('sélectionne le bon restaurant après un clic sidebar suivi d\'un clic sur un autre marqueur', async () => {
    const user = userEvent.setup()
    renderMap()

    await user.click(screen.getByRole('button', { name: /Chez Aline/ }))
    await screen.findByRole('heading', { name: 'Chez Aline', level: 2 })

    const markers = document.querySelectorAll('.leaflet-marker-icon')
    await user.click(markers[1])

    const heading = await screen.findByRole('heading', {
      name: 'Le Petit Coin',
      level: 2,
    })
    expect(heading).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Chez Aline', level: 2 }),
    ).not.toBeInTheDocument()
  })
})
