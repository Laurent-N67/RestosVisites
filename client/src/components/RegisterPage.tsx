import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { validerMotDePasse } from '../utils/motDePasse.ts'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [nomAffiche, setNomAffiche] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const violations = useMemo(() => validerMotDePasse(motDePasse), [motDePasse])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (violations.length > 0) {
      setError('Le mot de passe ne respecte pas encore toutes les règles ci-dessous.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await register({
        email: email.trim(),
        nomAffiche: nomAffiche.trim(),
        motDePasse,
      })
      navigate('/')
    } catch (err) {
      setError(errorMessage(err, "L'inscription a échoué."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="panel-form auth-form card" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Inscription</h2>

      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="register-nom-affiche">Nom affiché</label>
      <input
        id="register-nom-affiche"
        type="text"
        autoComplete="name"
        value={nomAffiche}
        onChange={(event) => setNomAffiche(event.target.value)}
        required
      />

      <label htmlFor="register-mot-de-passe">Mot de passe</label>
      <input
        id="register-mot-de-passe"
        type="password"
        autoComplete="new-password"
        value={motDePasse}
        onChange={(event) => setMotDePasse(event.target.value)}
        required
      />

      {motDePasse.length > 0 && violations.length > 0 && (
        <ul className="password-rules">
          {violations.map((violation) => (
            <li key={violation}>{violation}</li>
          ))}
        </ul>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Inscription…' : "S'inscrire"}
      </button>
    </form>
  )
}

export default RegisterPage
