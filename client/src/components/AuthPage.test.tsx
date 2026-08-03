import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPage from './AuthPage.tsx'

const { loginMock, registerMock, useAuthMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: useAuthMock,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Les deux formulaires (connexion / inscription) partagent les mêmes libellés
// "Email" et "Mot de passe" : on distingue les champs via getAllByLabelText,
// le formulaire de connexion étant rendu en premier dans le DOM.
describe('AuthPage', () => {
  beforeEach(() => {
    loginMock.mockReset()
    registerMock.mockReset()
    useAuthMock.mockReset()
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      login: loginMock,
      register: registerMock,
      logout: vi.fn(),
      refresh: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche les deux formulaires côte à côte', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inscription' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Email')).toHaveLength(2)
    expect(screen.getByLabelText('Nom affiché')).toBeInTheDocument()
  })

  it('soumet le formulaire de connexion et appelle login', async () => {
    loginMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const [loginEmail] = screen.getAllByLabelText('Email')
    const [loginMotDePasse] = screen.getAllByLabelText('Mot de passe')
    await user.type(loginEmail, 'user@example.com')
    await user.type(loginMotDePasse, 'MotDePasse123!')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      motDePasse: 'MotDePasse123!',
    })
    expect(await screen.findByText('Accueil')).toBeInTheDocument()
  })

  it("soumet le formulaire d'inscription et appelle register", async () => {
    registerMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const [, registerEmail] = screen.getAllByLabelText('Email')
    const [, registerMotDePasse] = screen.getAllByLabelText('Mot de passe')
    await user.type(registerEmail, 'user@example.com')
    await user.type(screen.getByLabelText('Nom affiché'), 'Une Personne')
    await user.type(registerMotDePasse, 'MotDePasse123!')
    await user.click(screen.getByRole('button', { name: "S'inscrire" }))

    expect(registerMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      nomAffiche: 'Une Personne',
      motDePasse: 'MotDePasse123!',
    })
    expect(await screen.findByText('Accueil')).toBeInTheDocument()
  })

  it("redirige vers l'accueil si l'utilisateur est déjà connecté", () => {
    useAuthMock.mockReturnValue({
      user: { id: '1', email: 'user@example.com', nomAffiche: 'Test', role: 0 },
      loading: false,
      login: loginMock,
      register: registerMock,
      logout: vi.fn(),
      refresh: vi.fn(),
    })
    renderPage()

    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Connexion' })).not.toBeInTheDocument()
  })
})
