import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  changerRole,
  getUtilisateursAvecFavoris,
  recompresserPhotosExistantes,
  reinitialiserMotDePasse,
} from '../api/client.ts'
import type { RecompresserPhotosResponse, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteUtilisateur } from '../hooks/useDeleteUtilisateur.ts'
import { errorMessage } from '../utils/errors.ts'
import { formatDate, formatOctets, stars } from '../utils/format.ts'
import { validerMotDePasse } from '../utils/motDePasse.ts'
import { averageNoteForUserRestaurant } from '../utils/visites.ts'
import Avatar from './Avatar.tsx'

const ROLE_LABELS: Record<Role, string> = {
  [Role.Simple]: 'Utilisateur',
  [Role.Admin]: 'Admin',
}

function formatRecompressionResult(resultat: RecompresserPhotosResponse): string {
  const { photosRecompressees, tailleAvantOctetsTotale, tailleApresOctetsTotale, photosEnErreur } =
    resultat

  if (photosRecompressees === 0) {
    return photosEnErreur > 0
      ? `Aucune photo à recompresser. ${formatPhotosEnErreur(photosEnErreur)}`
      : 'Aucune photo à recompresser : tout est déjà à jour.'
  }

  const reduction =
    tailleAvantOctetsTotale > 0
      ? Math.round((1 - tailleApresOctetsTotale / tailleAvantOctetsTotale) * 100)
      : 0

  let resume =
    `${photosRecompressees} photo${photosRecompressees > 1 ? 's' : ''} recompressée${photosRecompressees > 1 ? 's' : ''}, ` +
    `${formatOctets(tailleAvantOctetsTotale)} → ${formatOctets(tailleApresOctetsTotale)} (${reduction} % de réduction)`

  if (photosEnErreur > 0) {
    resume += ` — ${formatPhotosEnErreur(photosEnErreur)}`
  }

  return resume
}

function formatPhotosEnErreur(photosEnErreur: number): string {
  return photosEnErreur > 1
    ? `${photosEnErreur} photos n'ont pas pu être traitées.`
    : "1 photo n'a pas pu être traitée."
}

interface UtilisateursPageProps {
  visites: Visite[]
}

function UtilisateursPage({ visites }: UtilisateursPageProps) {
  const { user, clearSession } = useAuth()
  const navigate = useNavigate()
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

  const [recompressionPending, setRecompressionPending] = useState(false)
  const [recompressionError, setRecompressionError] = useState<string | null>(null)
  const [recompressionResult, setRecompressionResult] =
    useState<RecompresserPhotosResponse | null>(null)

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

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { error: deleteError, handleDelete: handleDeleteUtilisateur } =
    useDeleteUtilisateur((utilisateurSupprime) => {
      setDeletingId(null)

      // Un admin peut se supprimer lui-même depuis cet annuaire : le
      // backend invalide alors sa propre session. Il faut aligner le
      // client (déconnexion locale) plutôt que de recharger la liste, ce
      // qui échouerait avec un 401 générique.
      if (utilisateurSupprime.id === user?.id) {
        void clearSession()
        navigate('/')
        return
      }

      void loadUtilisateurs()
    })

  async function handleDeleteClick(utilisateur: UtilisateurAvecFavoris) {
    setDeletingId(utilisateur.id)
    await handleDeleteUtilisateur(utilisateur)
    setDeletingId(null)
  }

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

  async function handleRecompresserPhotos() {
    setRecompressionPending(true)
    setRecompressionError(null)
    setRecompressionResult(null)
    try {
      const resultat = await recompresserPhotosExistantes()
      setRecompressionResult(resultat)
    } catch (err) {
      setRecompressionError(errorMessage(err, 'La recompression des photos a échoué.'))
    } finally {
      setRecompressionPending(false)
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
      {isAdmin && (
        <section className="card maintenance-card">
          <h3>Maintenance</h3>
          <p>
            Les photos uploadées avant le 3 août 2026 n'ont pas encore été
            compressées au format WebP. Cette opération ponctuelle les
            retraite en une fois ; elle peut prendre du temps mais peut être
            relancée sans risque.
          </p>

          <button
            type="button"
            onClick={() => void handleRecompresserPhotos()}
            disabled={recompressionPending}
          >
            {recompressionPending
              ? 'Recompression en cours…'
              : 'Recompresser les anciennes photos'}
          </button>

          {recompressionError && (
            <p className="form-error">{recompressionError}</p>
          )}

          {recompressionResult && (
            <p className="form-success">
              {formatRecompressionResult(recompressionResult)}
            </p>
          )}
        </section>
      )}

      <h2>Annuaire des utilisateurs</h2>

      {loading && <p className="popup-status">Chargement…</p>}
      {loadError && <p className="popup-status popup-error">{loadError}</p>}
      {roleError && <p className="popup-status popup-error">{roleError}</p>}
      {deleteError && <p className="popup-status popup-error">{deleteError}</p>}

      {!loading && utilisateurs.length === 0 && (
        <p className="list-empty">Aucun utilisateur.</p>
      )}

      {utilisateurs.length > 0 && (
        <ul className="utilisateurs-list">
          {utilisateurs.map((utilisateur) => (
            <li
              key={utilisateur.id}
              className="utilisateur-card card card--interactive"
            >
              <div className="popup-header">
                <div className="utilisateur-avatar">
                  <Avatar name={utilisateur.nomAffiche} />
                  <div>
                    <h3>{utilisateur.nomAffiche}</h3>
                    {utilisateur.email && (
                      <p className="popup-adresse">{utilisateur.email}</p>
                    )}
                  </div>
                </div>

                {isAdmin ? (
                  <div className="utilisateur-admin-actions">
                    <label className="utilisateur-role-select">
                      Rôle
                      <select
                        value={utilisateur.role}
                        disabled={
                          pendingId === utilisateur.id ||
                          deletingId === utilisateur.id
                        }
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
                      disabled={
                        resetPasswordPendingId === utilisateur.id ||
                        deletingId === utilisateur.id
                      }
                      aria-expanded={resetPasswordForId === utilisateur.id}
                    >
                      Réinitialiser le mot de passe
                    </button>
                    <button
                      type="button"
                      className="utilisateur-delete-button"
                      onClick={() => void handleDeleteClick(utilisateur)}
                      disabled={
                        deletingId === utilisateur.id ||
                        pendingId === utilisateur.id ||
                        resetPasswordPendingId === utilisateur.id
                      }
                    >
                      {deletingId === utilisateur.id
                        ? 'Suppression…'
                        : 'Supprimer'}
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
