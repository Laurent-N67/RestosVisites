import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  changerRole,
  getUtilisateursAvecFavoris,
  reinitialiserMotDePasse,
} from '../api/client.ts'
import type { UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { formatDate, stars } from '../utils/format.ts'
import { validerMotDePasse } from '../utils/motDePasse.ts'
import { averageNoteForUserRestaurant } from '../utils/visites.ts'

const ROLE_LABELS: Record<Role, string> = {
  [Role.Simple]: 'Utilisateur',
  [Role.Admin]: 'Admin',
}

interface UtilisateursPageProps {
  visites: Visite[]
}

function UtilisateursPage({ visites }: UtilisateursPageProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin

  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAvecFavoris[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  const [resetPasswordForId, setResetPasswordForId] = useState<string | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resetPasswordPendingId, setResetPasswordPendingId] = useState<string | null>(null)
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null)
  const [resetPasswordSuccessId, setResetPasswordSuccessId] = useState<string | null>(null)

  const resetPasswordViolations = useMemo(
    () => validerMotDePasse(resetPasswordValue),
    [resetPasswordValue],
  )

  const loadUtilisateurs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUtilisateursAvecFavoris()
      setUtilisateurs(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(errorMessage(err, 'Impossible de charger les utilisateurs.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUtilisateurs()
  }, [loadUtilisateurs])

  async function handleRoleChange(id: string, nouveauRole: Role) {
    setPendingId(id)
    setRoleError(null)
    try {
      await changerRole(id, nouveauRole)
      setUtilisateurs((prev) =>
        prev.map((utilisateur) =>
          utilisateur.id === id
            ? { ...utilisateur, role: nouveauRole }
            : utilisateur,
        ),
      )
    } catch (err) {
      setRoleError(errorMessage(err, 'Le changement de rôle a échoué.'))
    } finally {
      setPendingId(null)
    }
  }

  function toggleResetPasswordForm(id: string) {
    if (resetPasswordForId === id) {
      closeResetPasswordForm()
      return
    }
    setResetPasswordForId(id)
    setResetPasswordValue('')
    setResetPasswordError(null)
    setResetPasswordSuccessId(null)
  }

  function closeResetPasswordForm() {
    setResetPasswordForId(null)
    setResetPasswordValue('')
    setResetPasswordError(null)
  }

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    if (resetPasswordViolations.length > 0) {
      setResetPasswordError('Le mot de passe ne respecte pas encore toutes les règles ci-dessous.')
      return
    }

    setResetPasswordPendingId(id)
    setResetPasswordError(null)
    try {
      await reinitialiserMotDePasse(id, resetPasswordValue)
      setResetPasswordForId(null)
      setResetPasswordValue('')
      setResetPasswordSuccessId(id)
    } catch (err) {
      setResetPasswordError(errorMessage(err, 'La réinitialisation du mot de passe a échoué.'))
    } finally {
      setResetPasswordPendingId(null)
    }
  }

  return (
    <div className="detail-page utilisateurs-page">
      <h2>Annuaire des utilisateurs</h2>

      {loading && <p className="popup-status">Chargement…</p>}
      {loadError && <p className="popup-status popup-error">{loadError}</p>}
      {roleError && <p className="popup-status popup-error">{roleError}</p>}

      {!loading && utilisateurs.length === 0 && (
        <p className="list-empty">Aucun utilisateur.</p>
      )}

      {utilisateurs.length > 0 && (
        <ul className="utilisateurs-list">
          {utilisateurs.map((utilisateur) => (
            <li key={utilisateur.id} className="utilisateur-card">
              <div className="popup-header">
                <div>
                  <h3>{utilisateur.nomAffiche}</h3>
                  {utilisateur.email && (
                    <p className="popup-adresse">{utilisateur.email}</p>
                  )}
                </div>

                {isAdmin ? (
                  <div className="utilisateur-admin-actions">
                    <label className="utilisateur-role-select">
                      Rôle
                      <select
                        value={utilisateur.role}
                        disabled={pendingId === utilisateur.id}
                        onChange={(event) =>
                          void handleRoleChange(
                            utilisateur.id,
                            Number(event.target.value) as Role,
                          )
                        }
                      >
                        <option value={Role.Simple}>Utilisateur</option>
                        <option value={Role.Admin}>Admin</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="utilisateur-reset-password-toggle"
                      onClick={() => toggleResetPasswordForm(utilisateur.id)}
                      disabled={resetPasswordPendingId === utilisateur.id}
                      aria-expanded={resetPasswordForId === utilisateur.id}
                    >
                      Réinitialiser le mot de passe
                    </button>
                  </div>
                ) : (
                  <span className="utilisateur-role-badge">
                    {ROLE_LABELS[utilisateur.role]}
                  </span>
                )}
              </div>

              {isAdmin && resetPasswordForId === utilisateur.id && (
                <form
                  className="utilisateur-reset-password-form"
                  onSubmit={(event) => void handleResetPasswordSubmit(event, utilisateur.id)}
                >
                  <label htmlFor={`reset-password-${utilisateur.id}`}>
                    Nouveau mot de passe
                  </label>
                  <input
                    id={`reset-password-${utilisateur.id}`}
                    type="password"
                    value={resetPasswordValue}
                    onChange={(event) => setResetPasswordValue(event.target.value)}
                    disabled={resetPasswordPendingId === utilisateur.id}
                    required
                  />

                  {resetPasswordValue.length > 0 && resetPasswordViolations.length > 0 && (
                    <ul className="password-rules">
                      {resetPasswordViolations.map((violation) => (
                        <li key={violation}>{violation}</li>
                      ))}
                    </ul>
                  )}

                  {resetPasswordError && (
                    <p className="form-error">{resetPasswordError}</p>
                  )}

                  <div className="utilisateur-reset-password-form-actions">
                    <button
                      type="submit"
                      disabled={resetPasswordPendingId === utilisateur.id}
                    >
                      {resetPasswordPendingId === utilisateur.id
                        ? 'Réinitialisation…'
                        : 'Valider'}
                    </button>
                    <button
                      type="button"
                      onClick={closeResetPasswordForm}
                      disabled={resetPasswordPendingId === utilisateur.id}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {isAdmin && resetPasswordSuccessId === utilisateur.id && (
                <p className="form-success">Mot de passe réinitialisé avec succès.</p>
              )}

              {utilisateur.favoris.length === 0 ? (
                <p className="popup-status">Aucun favori.</p>
              ) : (
                <ul className="popup-categories">
                  {utilisateur.favoris.map((favori) => {
                    const noteMoyenne = averageNoteForUserRestaurant(
                      visites,
                      utilisateur.id,
                      favori.restaurantId,
                    )
                    return (
                      <li key={favori.restaurantId}>
                        <Link to={`/restaurants/${favori.restaurantId}`}>
                          {favori.restaurantNom} · {formatDate(favori.dateAjout)}
                          {noteMoyenne !== null && (
                            <span
                              className="popup-stars"
                              aria-label={`Note moyenne ${noteMoyenne} sur 5`}
                            >
                              {' '}
                              {stars(Math.round(noteMoyenne))} ({noteMoyenne.toFixed(1)})
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default UtilisateursPage
