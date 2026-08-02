import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
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
    <div className="auth-page">
      <form className="panel-form auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <h2>Connexion</h2>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="login-mot-de-passe">Mot de passe</label>
        <input
          id="login-mot-de-passe"
          type="password"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
