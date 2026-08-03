import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <form className="panel-form auth-form card" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Connexion</h2>

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="login-mot-de-passe">Mot de passe</label>
      <input
        id="login-mot-de-passe"
        type="password"
        autoComplete="current-password"
        value={motDePasse}
        onChange={(event) => setMotDePasse(event.target.value)}
        required
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}

export default LoginPage
