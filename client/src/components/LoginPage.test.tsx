import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import LoginPage from './LoginPage.tsx'

const { loginMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
}))

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: loginMock,
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche le formulaire de connexion', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Bienvenue !' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
  })

  it('se connecte puis redirige vers l\'accueil', async () => {
    loginMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'MotDePasse123!')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      motDePasse: 'MotDePasse123!',
    })
    expect(await screen.findByText('Accueil')).toBeInTheDocument()
  })

  it("affiche une erreur si la connexion échoue", async () => {
    loginMock.mockRejectedValue(new ApiError(401, 'Non autorisé', 'Identifiants invalides.'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'mauvais')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Identifiants invalides.')).toBeInTheDocument()
  })
})
