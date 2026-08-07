import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { validerMotDePasse } from '../utils/motDePasse.ts'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon } from './icons/Icons.tsx'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [nomAffiche, setNomAffiche] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const violations = useMemo(() => validerMotDePasse(motDePasse), [motDePasse])
  const motDePasseConfirme =
    confirmMotDePasse.length === 0 || confirmMotDePasse === motDePasse

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (violations.length > 0) {
      setError('Le mot de passe ne respecte pas encore toutes les règles ci-dessous.')
      return
    }
    if (confirmMotDePasse !== motDePasse) {
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
    <form className="panel-form auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Créer un compte</h2>
      <p className="auth-form-subtitle">Rejoignez la communauté RestosVisites</p>

      <label htmlFor="register-email">Email</label>
      <div className="auth-field">
        <MailIcon className="auth-field-icon" aria-hidden="true" />
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <label htmlFor="register-nom-affiche">Nom affiché</label>
      <div className="auth-field">
        <UserIcon className="auth-field-icon" aria-hidden="true" />
        <input
          id="register-nom-affiche"
          type="text"
          autoComplete="name"
          placeholder="Nom affiché"
          value={nomAffiche}
          onChange={(event) => setNomAffiche(event.target.value)}
          required
        />
      </div>

      <label htmlFor="register-mot-de-passe">Mot de passe</label>
      <div className="auth-field auth-field--with-toggle">
        <LockIcon className="auth-field-icon" aria-hidden="true" />
        <input
          id="register-mot-de-passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
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

      {motDePasse.length > 0 && violations.length > 0 && (
        <ul className="password-rules">
          {violations.map((violation) => (
            <li key={violation}>{violation}</li>
          ))}
        </ul>
      )}

      <label htmlFor="register-confirm-mot-de-passe">Confirmer le mot de passe</label>
      <div className="auth-field">
        <LockIcon className="auth-field-icon" aria-hidden="true" />
        <input
          id="register-confirm-mot-de-passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Confirmer le mot de passe"
          value={confirmMotDePasse}
          onChange={(event) => setConfirmMotDePasse(event.target.value)}
          required
        />
      </div>
      {!motDePasseConfirme && (
        <p className="form-error">Les mots de passe ne correspondent pas.</p>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Inscription…' : 'Créer mon compte'}
      </button>
    </form>
  )
}

export default RegisterPage
