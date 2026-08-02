import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { changerMotDePasse, changerNomAffiche } from '../api/client.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { validerMotDePasse } from '../utils/motDePasse.ts'

function AccountPage() {
  const { user, refresh } = useAuth()

  const [nomAffiche, setNomAffiche] = useState(user?.nomAffiche ?? '')
  const [nomAffichePending, setNomAffichePending] = useState(false)
  const [nomAfficheError, setNomAfficheError] = useState<string | null>(null)
  const [nomAfficheSuccess, setNomAfficheSuccess] = useState(false)

  const [motDePasseActuel, setMotDePasseActuel] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [motDePassePending, setMotDePassePending] = useState(false)
  const [motDePasseError, setMotDePasseError] = useState<string | null>(null)
  const [motDePasseSuccess, setMotDePasseSuccess] = useState(false)

  const violations = useMemo(
    () => validerMotDePasse(nouveauMotDePasse),
    [nouveauMotDePasse],
  )

  async function handleNomAfficheSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNomAffichePending(true)
    setNomAfficheError(null)
    setNomAfficheSuccess(false)
    try {
      await changerNomAffiche(nomAffiche.trim())
      await refresh()
      setNomAfficheSuccess(true)
    } catch (err) {
      setNomAfficheError(errorMessage(err, 'La mise à jour du nom affiché a échoué.'))
    } finally {
      setNomAffichePending(false)
    }
  }

  async function handleMotDePasseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (violations.length > 0) {
      setMotDePasseError('Le mot de passe ne respecte pas encore toutes les règles ci-dessous.')
      return
    }

    setMotDePassePending(true)
    setMotDePasseError(null)
    setMotDePasseSuccess(false)
    try {
      await changerMotDePasse(motDePasseActuel, nouveauMotDePasse)
      setMotDePasseActuel('')
      setNouveauMotDePasse('')
      setMotDePasseSuccess(true)
    } catch (err) {
      setMotDePasseError(errorMessage(err, 'Le changement de mot de passe a échoué.'))
    } finally {
      setMotDePassePending(false)
    }
  }

  return (
    <div className="detail-page account-page">
      <h2>Mon compte</h2>

      <section className="utilisateur-card account-form">
        <h3>Nom affiché</h3>
        <form
          className="panel-form"
          onSubmit={(event) => void handleNomAfficheSubmit(event)}
        >
          <label htmlFor="account-nom-affiche">Nom affiché</label>
          <input
            id="account-nom-affiche"
            type="text"
            value={nomAffiche}
            onChange={(event) => setNomAffiche(event.target.value)}
            required
          />

          {nomAfficheError && <p className="form-error">{nomAfficheError}</p>}
          {nomAfficheSuccess && (
            <p className="form-success">Nom affiché mis à jour avec succès.</p>
          )}

          <button type="submit" disabled={nomAffichePending}>
            {nomAffichePending ? 'Mise à jour…' : 'Mettre à jour'}
          </button>
        </form>
      </section>

      <section className="utilisateur-card account-form">
        <h3>Mot de passe</h3>
        <form
          className="panel-form"
          onSubmit={(event) => void handleMotDePasseSubmit(event)}
        >
          <label htmlFor="account-mot-de-passe-actuel">Mot de passe actuel</label>
          <input
            id="account-mot-de-passe-actuel"
            type="password"
            value={motDePasseActuel}
            onChange={(event) => setMotDePasseActuel(event.target.value)}
            required
          />

          <label htmlFor="account-nouveau-mot-de-passe">Nouveau mot de passe</label>
          <input
            id="account-nouveau-mot-de-passe"
            type="password"
            value={nouveauMotDePasse}
            onChange={(event) => setNouveauMotDePasse(event.target.value)}
            required
          />

          {nouveauMotDePasse.length > 0 && violations.length > 0 && (
            <ul className="password-rules">
              {violations.map((violation) => (
                <li key={violation}>{violation}</li>
              ))}
            </ul>
          )}

          {motDePasseError && <p className="form-error">{motDePasseError}</p>}
          {motDePasseSuccess && (
            <p className="form-success">Mot de passe mis à jour avec succès.</p>
          )}

          <button type="submit" disabled={motDePassePending}>
            {motDePassePending ? 'Mise à jour…' : 'Mettre à jour'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default AccountPage
