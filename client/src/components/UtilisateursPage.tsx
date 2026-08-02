import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { changerRole, getUtilisateursAvecFavoris } from '../api/client.ts'
import type { UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { errorMessage } from '../utils/errors.ts'
import { formatDate, stars } from '../utils/format.ts'
import { averageNoteForUserRestaurant } from '../utils/visites.ts'

const ROLE_LABELS: Record<Role, string> = {
  [Role.Simple]: 'Simple',
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
                  <p className="popup-adresse">{utilisateur.email}</p>
                </div>

                {isAdmin ? (
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
                      <option value={Role.Simple}>Simple</option>
                      <option value={Role.Admin}>Admin</option>
                    </select>
                  </label>
                ) : (
                  <span className="utilisateur-role-badge">
                    {ROLE_LABELS[utilisateur.role]}
                  </span>
                )}
              </div>

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
