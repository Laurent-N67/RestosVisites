import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.ts'
import RegisterPage from './RegisterPage.tsx'

const { registerMock } = vi.hoisted(() => ({
  registerMock: vi.fn(),
}))

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    register: registerMock,
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'user@example.com')
  await user.type(screen.getByLabelText('Nom affiché'), 'Une Personne')
  await user.type(screen.getByLabelText('Mot de passe'), 'MotDePasse123!')
  await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'MotDePasse123!')
}

describe('RegisterPage', () => {
  beforeEach(() => {
    registerMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche le formulaire d\'inscription', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Créer un compte' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom affiché')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument()
  })

  it('affiche les règles de mot de passe non respectées en direct', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Mot de passe'), 'court')

    expect(screen.getByText('Au moins 12 caractères.')).toBeInTheDocument()
    expect(screen.getByText('Au moins une majuscule.')).toBeInTheDocument()
    expect(screen.getByText('Au moins un chiffre.')).toBeInTheDocument()
    expect(screen.getByText('Au moins un caractère spécial.')).toBeInTheDocument()
  })

  it('bloque la soumission tant que le mot de passe ne respecte pas la politique', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Nom affiché'), 'Une Personne')
    await user.type(screen.getByLabelText('Mot de passe'), 'faible')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'faible')
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(registerMock).not.toHaveBeenCalled()
    expect(
      screen.getByText('Le mot de passe ne respecte pas encore toutes les règles ci-dessous.'),
    ).toBeInTheDocument()
  })

  it('bloque la soumission si la confirmation ne correspond pas', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Nom affiché'), 'Une Personne')
    await user.type(screen.getByLabelText('Mot de passe'), 'MotDePasse123!')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'AutreChose123!')
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(registerMock).not.toHaveBeenCalled()
    expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
  })

  it("s'inscrit puis redirige vers l'accueil quand le mot de passe est valide", async () => {
    registerMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(registerMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      nomAffiche: 'Une Personne',
      motDePasse: 'MotDePasse123!',
    })
    expect(await screen.findByText('Accueil')).toBeInTheDocument()
  })

  it('affiche une erreur si le serveur refuse l\'inscription (422)', async () => {
    registerMock.mockRejectedValue(
      new ApiError(409, 'Conflit', 'Cet email est déjà utilisé.'),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('Cet email est déjà utilisé.')).toBeInTheDocument()
  })
})
