import { Link } from 'react-router-dom'
import type { Compagnie, Restaurant, Visite } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { formatDate, stars } from '../utils/format.ts'
import { buildJournal } from '../utils/visites.ts'
import type { JournalEntry } from '../utils/visites.ts'
import CoverPhoto from './CoverPhoto.tsx'

interface VisitesJournalPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
  onEditVisite: (visite: Visite) => void
  onVisiteDeleted: () => void
}

/**
 * Libellés d'affichage de l'enum `Compagnie` — n'existaient jusqu'ici que
 * sous forme de littéraux inline dans `AddVisitForm` (options du formulaire).
 * Extraits ici car réutilisés tels quels par le journal des visites ; si un
 * troisième composant en a besoin un jour, ça vaudra le coup de les déplacer
 * dans `utils/`.
 */
const COMPAGNIE_LABELS: Record<Compagnie, string> = {
  0: 'Seul',
  1: 'Couple',
  2: 'Amis',
  3: 'Famille',
}

export interface JournalCardProps {
  entry: JournalEntry
  onEditVisite: (visite: Visite) => void
  onVisiteDeleted: () => void
}

export function JournalCard({ entry, onEditVisite, onVisiteDeleted }: JournalCardProps) {
  const { visite, restaurant } = entry
  const { deletingId, error, handleDelete } = useDeleteVisite(onVisiteDeleted)

  const coverUrl =
    visite.urlsPhotos[0] ??
    restaurant.photos.find((photo) => photo.estPrincipale)?.url ??
    restaurant.photos[0]?.url

  return (
    <article className="journal-card card card--interactive">
      <CoverPhoto url={coverUrl} alt={restaurant.nom} />

      <h3>
        <Link
          className="journal-card-restaurant-link"
          to={`/restaurants/${restaurant.id}`}
        >
          {restaurant.nom}
        </Link>
      </h3>

      <div className="popup-visite-header">
        <span className="popup-stars" aria-label={`Note ${visite.note} sur 5`}>
          {stars(visite.note)}
        </span>
        <span className="popup-visite-date">{formatDate(visite.date)}</span>
      </div>

      {visite.avecQui !== null && (
        <span className="chip-filter journal-card-chip">
          {COMPAGNIE_LABELS[visite.avecQui]}
        </span>
      )}

      {visite.commentaire && (
        <p className="popup-visite-commentaire">{visite.commentaire}</p>
      )}

      {error && <p className="popup-status popup-error">{error}</p>}

      <div className="popup-visite-actions">
        <button
          type="button"
          className="popup-btn"
          onClick={() => onEditVisite(visite)}
        >
          Modifier
        </button>
        <button
          type="button"
          className="popup-btn popup-btn-danger"
          disabled={deletingId === visite.id}
          onClick={() => void handleDelete(visite)}
        >
          {deletingId === visite.id ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </article>
  )
}

function VisitesJournalPage({
  restaurants,
  visites,
  onEditVisite,
  onVisiteDeleted,
}: VisitesJournalPageProps) {
  const { user } = useAuth()
  const entries = user ? buildJournal(restaurants, visites, user.id) : []

  return (
    <div className="detail-page visites-journal-page">
      <div className="visites-journal-header">
        <h2>Mes visites</h2>
        <Link to="/liste" className="visites-journal-liste-link">
          Voir tous les restaurants
        </Link>
      </div>

      {entries.length === 0 && (
        <p className="list-empty">
          Vous n'avez pas encore enregistré de visite.
        </p>
      )}

      {entries.length > 0 && (
        <div className="journal-cards">
          {entries.map((entry) => (
            <JournalCard
              key={entry.visite.id}
              entry={entry}
              onEditVisite={onEditVisite}
              onVisiteDeleted={onVisiteDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default VisitesJournalPage
