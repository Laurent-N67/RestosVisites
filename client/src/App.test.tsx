import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { Role } from './api/types.ts'
import type { Utilisateur } from './api/types.ts'

const { useAuthMock, getRestaurantsMock, getAllVisitesMock, getCategoriesMock, getUtilisateursAvecFavorisMock } =
  vi.hoisted(() => ({
    useAuthMock: vi.fn(),
    getRestaurantsMock: vi.fn(),
    getAllVisitesMock: vi.fn(),
    getCategoriesMock: vi.fn(),
    getUtilisateursAvecFavorisMock: vi.fn(),
  }))

vi.mock('./contexts/AuthContext.tsx', () => ({
  useAuth: useAuthMock,
}))

vi.mock('./api/client.ts', async () => {
  const actual = await vi.importActual<typeof import('./api/client.ts')>('./api/client.ts')
  return {
    ...actual,
    getRestaurants: getRestaurantsMock,
    getAllVisites: getAllVisitesMock,
    getCategories: getCategoriesMock,
    getUtilisateursAvecFavoris: getUtilisateursAvecFavorisMock,
  }
})

const loggedInUser: Utilisateur = {
  id: 'user-1',
  email: 'user@example.com',
  nomAffiche: 'Une Personne',
  role: Role.Simple,
}

function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App - protection des routes', () => {
  beforeEach(() => {
    getRestaurantsMock.mockReset().mockResolvedValue([])
    getAllVisitesMock.mockReset().mockResolvedValue([])
    getCategoriesMock.mockReset().mockResolvedValue([])
    getUtilisateursAvecFavorisMock.mockReset().mockResolvedValue([])
    useAuthMock.mockReset()

    // jsdom n'implémente pas matchMedia : useTheme() en dépend pour la
    // préférence système par défaut.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('utilisateur non connecté', () => {
    beforeEach(() => {
      useAuthMock.mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refresh: vi.fn(),
      })
    })

    it("redirige vers /login depuis la carte ('/')", async () => {
      renderAppAt('/')

      expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Inscription' })).toBeInTheDocument()
    })

    it("redirige vers /login depuis la liste ('/liste')", async () => {
      renderAppAt('/liste')

      expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    })

    it("redirige vers /login depuis la fiche restaurant ('/restaurants/:id')", async () => {
      renderAppAt('/restaurants/restaurant-1')

      expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    })

    it('la route /register redirige vers /login', async () => {
      renderAppAt('/register')

      expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    })
  })

  describe('utilisateur connecté', () => {
    beforeEach(() => {
      useAuthMock.mockReturnValue({
        user: loggedInUser,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refresh: vi.fn(),
      })
    })

    it("affiche la liste des restaurants sur '/liste' sans redirection", async () => {
      renderAppAt('/liste')

      expect(await screen.findByText('Aucun restaurant enregistré.')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Connexion' })).not.toBeInTheDocument()
    })
  })
})
