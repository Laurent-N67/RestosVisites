import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compagnie } from '../api/types.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { formatDate, formatNoteMoyenne } from '../utils/format.ts'
import { averageNote, buildJournal } from '../utils/visites.ts'
import type { JournalEntry } from '../utils/visites.ts'
import CategoryBadges from './CategoryBadges.tsx'
import VisitePhotoCarousel from './VisitePhotoCarousel.tsx'
import { ChevronDownIcon, SearchIcon } from './icons/Icons.tsx'

interface MesVisitesPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
  onEditVisite: (visite: Visite) => void
  onVisiteDeleted: () => void
}

type SortOption =
  | 'recent'
  | 'ancien'
  | 'meilleureNote'
  | 'tempsAttenteAsc'
  | 'tempsAttenteDesc'

interface RestaurantStats {
  average: number | null
  count: number
}

// Mêmes libellés que `compagnieOptions` dans `AddVisitForm.tsx` — dupliqués
// ici plutôt que d'importer ce fichier de formulaire pour une simple table de
// libellés d'affichage.
const compagnieLabels: Record<Compagnie, string> = {
  [Compagnie.Seul]: 'Seul',
  [Compagnie.Couple]: 'Couple',
  [Compagnie.Amis]: 'Amis',
  [Compagnie.Famille]: 'Famille',
}

function restaurantStatsById(visites: Visite[]): Map<string, RestaurantStats> {
  const byRestaurant = new Map<string, Visite[]>()
  for (const visite of visites) {
    const list = byRestaurant.get(visite.restaurantId)
    if (list) {
      list.push(visite)
    } else {
      byRestaurant.set(visite.restaurantId, [visite])
    }
  }
  const stats = new Map<string, RestaurantStats>()
  for (const [restaurantId, restaurantVisites] of byRestaurant) {
    stats.set(restaurantId, {
      average: averageNote(restaurantVisites),
      count: restaurantVisites.length,
    })
  }
  return stats
}

/**
 * Compare deux entrées par temps d'attente, une entrée sans temps d'attente
 * connu (`null`) passant toujours en dernier, quel que soit le sens du tri.
 */
function compareTempsAttente(
  a: JournalEntry,
  b: JournalEntry,
  direction: 'asc' | 'desc',
): number {
  const aValue = a.visite.tempsAttente
  const bValue = b.visite.tempsAttente
  if (aValue === null && bValue === null) {
    return 0
  }
  if (aValue === null) {
    return 1
  }
  if (bValue === null) {
    return -1
  }
  return direction === 'asc' ? aValue - bValue : bValue - aValue
}

function sortJournal(entries: JournalEntry[], sortOption: SortOption): JournalEntry[] {
  const sorted = [...entries]
  switch (sortOption) {
    case 'recent':
      sorted.sort((a, b) => b.visite.date.localeCompare(a.visite.date))
      break
    case 'ancien':
      sorted.sort((a, b) => a.visite.date.localeCompare(b.visite.date))
      break
    case 'meilleureNote':
      sorted.sort((a, b) => b.visite.note - a.visite.note)
      break
    case 'tempsAttenteAsc':
      sorted.sort((a, b) => compareTempsAttente(a, b, 'asc'))
      break
    case 'tempsAttenteDesc':
      sorted.sort((a, b) => compareTempsAttente(a, b, 'desc'))
      break
  }
  return sorted
}

interface VisiteActionsMenuProps {
  restaurantNom: string
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}

function VisiteActionsMenu({
  restaurantNom,
  onEdit,
  onDelete,
  deleting,
}: VisiteActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="visites-card-menu" ref={containerRef}>
      <button
        type="button"
        className="visites-card-menu-trigger"
        aria-label={`Actions pour la visite de ${restaurantNom}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        ⋮
      </button>
      {open && (
        <div className="visites-card-menu-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            Modifier
          </button>
          <button
            type="button"
            role="menuitem"
            className="visites-card-menu-danger"
            disabled={deleting}
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      )}
    </div>
  )
}

interface VisiteCardProps {
  entry: JournalEntry
  stats: RestaurantStats
  onEditVisite: (visite: Visite) => void
  deleting: boolean
  onDelete: (visite: Visite) => void
}

function VisiteCard({ entry, stats, onEditVisite, deleting, onDelete }: VisiteCardProps) {
  const { visite, restaurant } = entry

  return (
    <article className="visites-card card">
      <div className="visites-card-photos">
        <VisitePhotoCarousel photos={visite.urlsPhotos} alt={restaurant.nom} />
      </div>

      <div className="visites-card-body">
        <div className="visites-card-header">
          <div className="visites-card-heading">
            <h3 className="visites-card-title">{restaurant.nom}</h3>
            {stats.count > 0 && stats.average !== null && (
              <span
                className="visites-card-rating"
                aria-label={`Note moyenne ${formatNoteMoyenne(stats.average)} sur 5 (${stats.count} avis)`}
              >
                <span className="visites-card-rating-star" aria-hidden="true">
                  ★
                </span>
                {formatNoteMoyenne(stats.average)}
              </span>
            )}
          </div>
          <VisiteActionsMenu
            restaurantNom={restaurant.nom}
            onEdit={() => onEditVisite(visite)}
            onDelete={() => onDelete(visite)}
            deleting={deleting}
          />
        </div>

        <p className="visites-card-adresse">{restaurant.adresse}</p>

        {restaurant.categories.length > 0 && (
          <CategoryBadges categories={restaurant.categories} max={3} />
        )}

        <dl className="visites-card-facts">
          <div className="visites-card-fact">
            <dt>Date de visite</dt>
            <dd>{formatDate(visite.date)}</dd>
          </div>
          <div className="visites-card-fact">
            <dt>Temps d'attente</dt>
            <dd>{visite.tempsAttente !== null ? `${visite.tempsAttente} min` : '—'}</dd>
          </div>
          <div className="visites-card-fact">
            <dt>Type de visite</dt>
            <dd>{visite.avecQui !== null ? compagnieLabels[visite.avecQui] : '—'}</dd>
          </div>
          <div className="visites-card-fact">
            <dt>Budget dépensé</dt>
            <dd>{visite.budget !== null ? `${visite.budget} €` : '—'}</dd>
          </div>
        </dl>

        {visite.commentaire && <p className="visites-card-note">{visite.commentaire}</p>}

        <div className="visites-card-actions">
          <Link className="visites-card-cta" to={`/restaurants/${restaurant.id}`}>
            Voir la fiche du restaurant
          </Link>
          <button
            type="button"
            className="visites-card-cta visites-card-cta--secondary"
            onClick={() => onEditVisite(visite)}
          >
            Modifier la visite
          </button>
        </div>
      </div>
    </article>
  )
}

function MesVisitesPage({
  restaurants,
  visites,
  onEditVisite,
  onVisiteDeleted,
}: MesVisitesPageProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [waitMin, setWaitMin] = useState('')
  const [waitMax, setWaitMax] = useState('')
  const [minNote, setMinNote] = useState(0)
  const [compagnie, setCompagnie] = useState<Compagnie | ''>('')
  const [sortOption, setSortOption] = useState<SortOption>('recent')

  const { deletingId, handleDelete } = useDeleteVisite(() => onVisiteDeleted())

  const journal = useMemo(
    () => (user ? buildJournal(restaurants, visites, user.id) : []),
    [restaurants, visites, user],
  )

  const statsById = useMemo(() => restaurantStatsById(visites), [visites])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const hasWaitBound = waitMin !== '' || waitMax !== ''
    return journal.filter(({ visite, restaurant }) => {
      const matchesSearch =
        query.length === 0 ||
        restaurant.nom.toLowerCase().includes(query) ||
        restaurant.adresse.toLowerCase().includes(query)
      const matchesDateStart = dateStart === '' || visite.date >= dateStart
      const matchesDateEnd = dateEnd === '' || visite.date <= dateEnd
      const matchesWait = !hasWaitBound
        ? true
        : visite.tempsAttente !== null &&
          (waitMin === '' || visite.tempsAttente >= Number(waitMin)) &&
          (waitMax === '' || visite.tempsAttente <= Number(waitMax))
      const matchesNote = visite.note >= minNote
      const matchesCompagnie = compagnie === '' || visite.avecQui === compagnie
      return (
        matchesSearch &&
        matchesDateStart &&
        matchesDateEnd &&
        matchesWait &&
        matchesNote &&
        matchesCompagnie
      )
    })
  }, [journal, search, dateStart, dateEnd, waitMin, waitMax, minNote, compagnie])

  const sorted = useMemo(() => sortJournal(filtered, sortOption), [filtered, sortOption])

  return (
    <div className="mes-visites-page">
      <div className="visites-header">
        <h1>Mes visites</h1>
        <p>
          {sorted.length} visite{sorted.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="list-controls">
        <div className="list-search-wrap">
          <SearchIcon className="list-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="list-search"
            placeholder="Rechercher un restaurant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="list-controls-filters">
          <label className="visites-filter-date">
            Du
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </label>
          <label className="visites-filter-date">
            Au
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </label>

          <label className="visites-filter-number">
            Attente min
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={waitMin}
              onChange={(e) => setWaitMin(e.target.value)}
            />
          </label>
          <label className="visites-filter-number">
            Attente max
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={waitMax}
              onChange={(e) => setWaitMax(e.target.value)}
            />
          </label>

          <label className="list-sort-label list-sort-label--note">
            Note
            <select value={minNote} onChange={(e) => setMinNote(Number(e.target.value))}>
              <option value={0}>Toutes notes</option>
              <option value={1}>1 étoile et plus</option>
              <option value={2}>2 étoiles et plus</option>
              <option value={3}>3 étoiles et plus</option>
              <option value={4}>4 étoiles et plus</option>
              <option value={5}>5 étoiles</option>
            </select>
            <ChevronDownIcon className="list-sort-chevron" aria-hidden="true" />
          </label>

          <label className="list-sort-label list-sort-label--type">
            Type de visite
            <select
              value={compagnie}
              onChange={(e) =>
                setCompagnie(e.target.value === '' ? '' : (Number(e.target.value) as Compagnie))
              }
            >
              <option value="">Tous</option>
              <option value={Compagnie.Seul}>Seul</option>
              <option value={Compagnie.Couple}>Couple</option>
              <option value={Compagnie.Amis}>Amis</option>
              <option value={Compagnie.Famille}>Famille</option>
            </select>
            <ChevronDownIcon className="list-sort-chevron" aria-hidden="true" />
          </label>

          <label className="list-sort-label list-sort-label--sort">
            Trier
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              <option value="recent">Plus récentes</option>
              <option value="ancien">Plus anciennes</option>
              <option value="meilleureNote">Meilleure note</option>
              <option value="tempsAttenteAsc">Temps d'attente croissant</option>
              <option value="tempsAttenteDesc">Temps d'attente décroissant</option>
            </select>
            <ChevronDownIcon className="list-sort-chevron" aria-hidden="true" />
          </label>
        </div>
      </div>

      {journal.length === 0 && (
        <p className="list-empty">Aucune visite enregistrée pour le moment.</p>
      )}
      {journal.length > 0 && sorted.length === 0 && (
        <p className="list-empty">Aucune visite ne correspond aux filtres.</p>
      )}

      {sorted.length > 0 && (
        <div className="visites-cards">
          {sorted.map((entry) => (
            <VisiteCard
              key={entry.visite.id}
              entry={entry}
              stats={statsById.get(entry.restaurant.id) ?? { average: null, count: 0 }}
              onEditVisite={onEditVisite}
              deleting={deletingId === entry.visite.id}
              onDelete={(visite) => void handleDelete(visite)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MesVisitesPage
