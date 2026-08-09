import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from './icons/Icons.tsx'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login({ email: email.trim(), motDePasse })
      navigate('/')
    } catch (err) {
      setError(errorMessage(err, 'La connexion a échoué.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="panel-form auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Bienvenue !</h2>
      <p className="auth-form-subtitle">Connectez-vous à votre compte</p>

      <label htmlFor="login-email">Email</label>
      <div className="auth-field">
        <MailIcon className="auth-field-icon" aria-hidden="true" />
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <label htmlFor="login-mot-de-passe">Mot de passe</label>
      <div className="auth-field auth-field--with-toggle">
        <LockIcon className="auth-field-icon" aria-hidden="true" />
        <input
          id="login-mot-de-passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          required
        />
        <button
          type="button"
          className="auth-field-toggle"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={
            showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
          }
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      <button
        type="button"
        className="auth-forgot-link"
        disabled
        title="Fonctionnalité à venir"
      >
        Mot de passe oublié ?
      </button>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}

export default LoginPage
