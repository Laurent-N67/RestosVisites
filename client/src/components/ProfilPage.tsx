import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  changerMotDePasse,
  changerNomAffiche,
  supprimerMonCompte,
} from '../api/client.ts'
import { Role } from '../api/types.ts'
import type { Visite } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useFavoris } from '../contexts/FavorisContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { validerMotDePasse } from '../utils/motDePasse.ts'
import Avatar from './Avatar.tsx'

interface ProfilPageProps {
  visites: Visite[]
}

function ProfilPage({ visites }: ProfilPageProps) {
  const { user, refresh, clearSession } = useAuth()
  const { favoriIds } = useFavoris()
  const navigate = useNavigate()

  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const mesVisites = useMemo(
    () => visites.filter((visite) => visite.utilisateurId === user?.id),
    [visites, user?.id],
  )
  const restaurantsVisites = useMemo(
    () => new Set(mesVisites.map((visite) => visite.restaurantId)).size,
    [mesVisites],
  )

  const isAdmin = user?.role === Role.Admin

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

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        'Supprimer définitivement votre compte et toutes vos visites ?',
      )
    ) {
      return
    }

    setDeletePending(true)
    setDeleteError(null)
    try {
      await supprimerMonCompte()
      // On navigue avant que la partie asynchrone de clearSession() (vidage
      // du cache Api) ne rende la main : clearSession() vide déjà l'état
      // utilisateur de façon synchrone avant son premier await, donc
      // l'appeler puis naviguer dans la foulée, sans l'attendre, évite que
      // <ProtectedRoute> ne redirige vers /login avant que l'accueil ne
      // soit affiché (flash visuel).
      navigate('/')
      void clearSession()
    } catch (err) {
      setDeleteError(errorMessage(err, 'La suppression du compte a échoué.'))
      setDeletePending(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="detail-page profil-page">
      <div className="profil-header">
        <Avatar name={user.nomAffiche} size={64} />
        <div>
          <h2>{user.nomAffiche}</h2>
          <p className="profil-email">{user.email}</p>
        </div>
      </div>

      <div className="stats-tiles">
        <div className="card stats-tile">
          <span className="stats-tile-value">{restaurantsVisites}</span>
          <span className="stats-tile-label">Restaurants</span>
        </div>
        <div className="card stats-tile">
          <span className="stats-tile-value">{mesVisites.length}</span>
          <span className="stats-tile-label">Visites</span>
        </div>
        <div className="card stats-tile">
          <span className="stats-tile-value">{favoriIds.size}</span>
          <span className="stats-tile-label">Favoris</span>
        </div>
      </div>

      {isAdmin && (
        <section className="utilisateur-card profil-admin-section">
          <h3>Administration</h3>
          <div className="profil-admin-links">
            <Link to="/utilisateurs" className="profil-admin-link">
              Gestion utilisateurs &amp; rôles
            </Link>
            <Link to="/stats" className="profil-admin-link">
              Statistiques globales
            </Link>
          </div>
        </section>
      )}

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

      <section className="utilisateur-card account-form account-danger">
        <h3>Supprimer mon compte</h3>
        <p>
          La suppression de votre compte est définitive et supprimera aussi
          toutes vos visites.
        </p>

        {deleteError && <p className="form-error">{deleteError}</p>}

        <button
          type="button"
          className="account-danger-button"
          onClick={() => void handleDeleteAccount()}
          disabled={deletePending}
        >
          {deletePending ? 'Suppression…' : 'Supprimer mon compte'}
        </button>
      </section>
    </div>
  )
}

export default ProfilPage
