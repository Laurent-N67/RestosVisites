import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import RestaurantDetailPage from './RestaurantDetailPage.tsx'

const { deleteRestaurantMock, deleteVisiteMock, getMesFavorisMock } = vi.hoisted(
  () => ({
    deleteRestaurantMock: vi.fn(),
    deleteVisiteMock: vi.fn(),
    getMesFavorisMock: vi.fn(),
  }),
)

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

const restaurant: Restaurant = {
  id: 'restaurant-1',
  nom: 'Le Bon Coin',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [{ id: 'cat-1', nom: 'Italien', groupe: 'Type de cuisine' }],
}

const visites: Visite[] = [
  {
    id: 'visite-1',
    restaurantId: 'restaurant-1',
    date: '2026-07-01',
    note: 4,
    commentaire: 'Très bon',
    urlsPhotos: ['/uploads/photo-1.jpg'],
    utilisateurId: 'user-2',
    utilisateurNomAffiche: 'Une Autre Personne',
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
  },
]

function renderPage(
  props: Partial<React.ComponentProps<typeof RestaurantDetailPage>> = {},
  route = '/restaurants/restaurant-1',
) {
  const defaultProps = {
    restaurants: [restaurant],
    visites,
    utilisateursAvecFavoris: [],
    onEditRestaurant: vi.fn(),
    onEditVisite: vi.fn(),
    onRestaurantDeleted: vi.fn(),
    onVisiteDeleted: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <FavorisProvider>
        <Routes>
          <Route
            path="/restaurants/:id"
            element={<RestaurantDetailPage {...defaultProps} {...props} />}
          />
        </Routes>
      </FavorisProvider>
    </MemoryRouter>,
  )
}

describe('RestaurantDetailPage', () => {
  beforeEach(() => {
    deleteRestaurantMock.mockReset()
    deleteVisiteMock.mockReset()
    getMesFavorisMock.mockReset()
    getMesFavorisMock.mockResolvedValue([])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("affiche un état 'introuvable' pour un id inconnu", () => {
    renderPage({}, '/restaurants/inconnu')

    expect(screen.getByText('Restaurant introuvable.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: restaurant.nom }),
    ).not.toBeInTheDocument()
  })

  it("affiche le restaurant et l'historique complet des visites, la plus récente d'abord", () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Le Bon Coin' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 rue de Paris')).toBeInTheDocument()
    expect(screen.getByText('Italien')).toBeInTheDocument()

    const dates = screen.getAllByText(/^\d{2}\/\d{2}\/2026$/)
    expect(dates.map((d) => d.textContent)).toEqual(['01/08/2026', '01/07/2026'])
  })

  it('supprime le restaurant et notifie le parent', async () => {
    deleteRestaurantMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const onRestaurantDeleted = vi.fn()
    renderPage({ onRestaurantDeleted })

    await user.click(
      screen.getAllByRole('button', { name: 'Supprimer' })[0],
    )

    await waitFor(() => expect(deleteRestaurantMock).toHaveBeenCalledWith('restaurant-1'))
    expect(onRestaurantDeleted).toHaveBeenCalledTimes(1)
  })

  it("affiche une erreur si la suppression du restaurant échoue", async () => {
    deleteRestaurantMock.mockRejectedValue(
      new ApiError(409, 'Conflit', 'Le restaurant a encore des visites.'),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getAllByRole('button', { name: 'Supprimer' })[0],
    )

    expect(
      await screen.findByText('Le restaurant a encore des visites.'),
    ).toBeInTheDocument()
  })

  it('supprime une visite et notifie le parent', async () => {
    deleteVisiteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const onVisiteDeleted = vi.fn()
    renderPage({ onVisiteDeleted })

    const deleteButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    await user.click(deleteButtons[1])

    await waitFor(() => expect(deleteVisiteMock).toHaveBeenCalledWith('visite-2'))
    expect(onVisiteDeleted).toHaveBeenCalledTimes(1)
  })

  it("affiche une erreur si la suppression d'une visite échoue", async () => {
    deleteVisiteMock.mockRejectedValue(
      new ApiError(500, 'Erreur serveur', 'La visite est introuvable.'),
    )
    const user = userEvent.setup()
    renderPage()

    const deleteButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    await user.click(deleteButtons[1])

    expect(
      await screen.findByText('La visite est introuvable.'),
    ).toBeInTheDocument()
  })

  it("affiche le badge favori quand l'auteur de la visite a le restaurant en favori", () => {
    renderPage({
      utilisateursAvecFavoris: [
        {
          id: 'user-2',
          email: 'user2@example.com',
          nomAffiche: 'Une Autre Personne',
          role: Role.Simple,
          favoris: [
            {
              restaurantId: 'restaurant-1',
              restaurantNom: 'Le Bon Coin',
              dateAjout: '2026-07-01',
            },
          ],
        },
      ],
    })

    expect(screen.getAllByText('★ Restaurant favori !')).toHaveLength(2)
  })

  it("n'affiche pas le badge favori si l'auteur n'a pas le restaurant en favori", () => {
    renderPage({
      utilisateursAvecFavoris: [
        {
          id: 'user-2',
          email: 'user2@example.com',
          nomAffiche: 'Une Autre Personne',
          role: Role.Simple,
          favoris: [],
        },
      ],
    })

    expect(screen.queryByText('★ Restaurant favori !')).not.toBeInTheDocument()
  })

  it('ouvre la lightbox sur la photo cliquée', async () => {
    const user = userEvent.setup()
    renderPage()

    const thumbnails = document.querySelectorAll('.detail-photo-thumb')
    expect(thumbnails.length).toBe(1)
    await user.click(thumbnails[0])

    expect(document.querySelector('.lightbox-overlay')).toBeInTheDocument()
    expect(document.querySelector('.lightbox-image')).toHaveAttribute(
      'src',
      'http://localhost:5006/uploads/photo-1.jpg',
    )
  })
})
