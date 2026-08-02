import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Categorie, Restaurant, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import {
  groupCategories,
  groupSelectedIdsByGroupe,
  matchesCategoryFilters,
} from '../utils/categories.ts'
import { hasVisiteByUser, meetsRatingThreshold } from '../utils/visites.ts'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { formatDate, stars } from '../utils/format.ts'
import CategoryFilterDropdown from './CategoryFilterDropdown.tsx'

interface RestaurantsListProps {
  restaurants: Restaurant[]
  visites: Visite[]
  onEditRestaurant: (restaurant: Restaurant) => void
  onRestaurantDeleted: () => void
}

type SortOption = 'nom' | 'derniereVisite' | 'nombreVisites'
type VisitedFilter = 'tous' | 'visite' | 'nonVisite'

interface RestaurantAggregate {
  restaurant: Restaurant
  count: number
  lastVisite: Visite | null
  categories: Categorie[]
  averageNote: number | null
  restaurantVisites: Visite[]
}

function aggregate(
  restaurants: Restaurant[],
  visites: Visite[],
): RestaurantAggregate[] {
  const visitesByRestaurant = new Map<string, Visite[]>()
  for (const visite of visites) {
    const list = visitesByRestaurant.get(visite.restaurantId)
    if (list) {
      list.push(visite)
    } else {
      visitesByRestaurant.set(visite.restaurantId, [visite])
    }
  }

  return restaurants.map((restaurant) => {
    const restaurantVisites = visitesByRestaurant.get(restaurant.id) ?? []
    const lastVisite = restaurantVisites.reduce<Visite | null>(
      (latest, visite) =>
        !latest || visite.date.localeCompare(latest.date) > 0
          ? visite
          : latest,
      null,
    )
    const categories = [...restaurant.categories].sort((a, b) =>
      a.nom.localeCompare(b.nom, 'fr'),
    )
    const averageNote =
      restaurantVisites.length > 0
        ? restaurantVisites.reduce((sum, visite) => sum + visite.note, 0) /
          restaurantVisites.length
        : null

    return {
      restaurant,
      count: restaurantVisites.length,
      lastVisite,
      categories,
      averageNote,
      restaurantVisites,
    }
  })
}

function sortAggregates(
  aggregates: RestaurantAggregate[],
  sortOption: SortOption,
): RestaurantAggregate[] {
  const sorted = [...aggregates]
  switch (sortOption) {
    case 'nom':
      sorted.sort((a, b) =>
        a.restaurant.nom.localeCompare(b.restaurant.nom, 'fr'),
      )
      break
    case 'derniereVisite':
      sorted.sort((a, b) => {
        if (!a.lastVisite && !b.lastVisite) return 0
        if (!a.lastVisite) return 1
        if (!b.lastVisite) return -1
        return b.lastVisite.date.localeCompare(a.lastVisite.date)
      })
      break
    case 'nombreVisites':
      sorted.sort((a, b) => b.count - a.count)
      break
  }
  return sorted
}

interface RestaurantCardProps {
  aggregate: RestaurantAggregate
  onEditRestaurant: (restaurant: Restaurant) => void
  onRestaurantDeleted: () => void
}

function RestaurantCard({
  aggregate: item,
  onEditRestaurant,
  onRestaurantDeleted,
}: RestaurantCardProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin
  const { deleting, error, handleDelete } =
    useDeleteRestaurant(onRestaurantDeleted)
  const {
    isFavori,
    loading: favoriLoading,
    pending: favoriPending,
    error: favoriError,
    toggle: toggleFavori,
  } = useFavoriToggle(item.restaurant.id)
  const { restaurant, count, lastVisite, categories } = item

  return (
    <article className="restaurant-card">
      <div className="popup-header">
        <h3>{restaurant.nom}</h3>
        {user && (
          <div className="popup-actions">
            <button
              type="button"
              className={isFavori ? 'popup-btn popup-btn-favori-active' : 'popup-btn'}
              disabled={favoriLoading || favoriPending}
              onClick={() => void toggleFavori()}
            >
              {isFavori ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="popup-btn"
                  onClick={() => onEditRestaurant(restaurant)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="popup-btn popup-btn-danger"
                  disabled={deleting}
                  onClick={() => void handleDelete(restaurant)}
                >
                  {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="popup-adresse">{restaurant.adresse}</p>
      {error && <p className="popup-status popup-error">{error}</p>}
      {favoriError && <p className="popup-status popup-error">{favoriError}</p>}

      <p className="list-card-count">
        {count} {count > 1 ? 'visites' : 'visite'}
      </p>

      {lastVisite ? (
        <div className="list-card-last-visite">
          <span
            className="popup-stars"
            aria-label={`Note ${lastVisite.note} sur 5`}
          >
            {stars(lastVisite.note)}
          </span>
          <span className="popup-visite-date">
            {formatDate(lastVisite.date)}
          </span>
        </div>
      ) : (
        <p className="popup-status">Aucune visite enregistrée.</p>
      )}

      {categories.length > 0 && (
        <ul className="popup-categories">
          {categories.map((categorie) => (
            <li key={categorie.id}>{categorie.nom}</li>
          ))}
        </ul>
      )}

      {count > 0 && (
        <Link
          className="popup-directions"
          to={`/restaurants/${restaurant.id}`}
        >
          Voir toutes les visites
        </Link>
      )}
    </article>
  )
}

function RestaurantsList({
  restaurants,
  visites,
  onEditRestaurant,
  onRestaurantDeleted,
}: RestaurantsListProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )
  const [sortOption, setSortOption] = useState<SortOption>('nom')
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('tous')
  const [minNote, setMinNote] = useState(0)

  const aggregates = useMemo(
    () => aggregate(restaurants, visites),
    [restaurants, visites],
  )

  const allCategoriesGrouped = useMemo(() => {
    const byId = new Map<string, Categorie>()
    for (const restaurant of restaurants) {
      for (const categorie of restaurant.categories) {
        byId.set(categorie.id, categorie)
      }
    }
    return groupCategories(Array.from(byId.values()))
  }, [restaurants])

  const categorieGroupeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const [groupe, categoriesDuGroupe] of allCategoriesGrouped) {
      for (const categorie of categoriesDuGroupe) {
        map.set(categorie.id, groupe)
      }
    }
    return map
  }, [allCategoriesGrouped])

  const selectedIdsByGroupe = useMemo(
    () => groupSelectedIdsByGroupe(selectedCategories, categorieGroupeById),
    [selectedCategories, categorieGroupeById],
  )

  function toggleCategory(categorieId: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categorieId)) {
        next.delete(categorieId)
      } else {
        next.add(categorieId)
      }
      return next
    })
  }

  function clearCategories() {
    setSelectedCategories(new Set())
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return aggregates.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        item.restaurant.nom.toLowerCase().includes(query)
      const itemCategoryIds = new Set(item.categories.map((c) => c.id))
      const matchesCategory = matchesCategoryFilters(
        itemCategoryIds,
        selectedIdsByGroupe,
      )
      const matchesVisited =
        visitedFilter === 'tous' || !user
          ? true
          : visitedFilter === 'visite'
            ? hasVisiteByUser(item.restaurantVisites, user.id)
            : !hasVisiteByUser(item.restaurantVisites, user.id)
      const matchesNote = meetsRatingThreshold(item.averageNote, minNote)
      return matchesSearch && matchesCategory && matchesVisited && matchesNote
    })
  }, [aggregates, search, selectedIdsByGroupe, visitedFilter, minNote, user])

  const sorted = useMemo(
    () => sortAggregates(filtered, sortOption),
    [filtered, sortOption],
  )

  return (
    <div className="restaurants-list-view">
      <div className="list-controls">
        <input
          type="search"
          className="list-search"
          placeholder="Rechercher un restaurant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <CategoryFilterDropdown
          categoriesGrouped={allCategoriesGrouped}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onClear={clearCategories}
        />

        {user && (
          <div className="list-visited-switch">
            <button
              type="button"
              className={visitedFilter === 'tous' ? 'active' : ''}
              onClick={() => setVisitedFilter('tous')}
            >
              Tous
            </button>
            <button
              type="button"
              className={visitedFilter === 'visite' ? 'active' : ''}
              onClick={() => setVisitedFilter('visite')}
            >
              Déjà visité
            </button>
            <button
              type="button"
              className={visitedFilter === 'nonVisite' ? 'active' : ''}
              onClick={() => setVisitedFilter('nonVisite')}
            >
              Pas encore visité
            </button>
          </div>
        )}

        <label className="list-sort-label">
          Note minimale
          <select
            value={minNote}
            onChange={(e) => setMinNote(Number(e.target.value))}
          >
            <option value={0}>Toutes notes</option>
            <option value={1}>1 étoile et plus</option>
            <option value={2}>2 étoiles et plus</option>
            <option value={3}>3 étoiles et plus</option>
            <option value={4}>4 étoiles et plus</option>
            <option value={5}>5 étoiles</option>
          </select>
        </label>

        <label className="list-sort-label">
          Trier par
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="nom">Nom (A → Z)</option>
            <option value="derniereVisite">Dernière visite (récente d'abord)</option>
            <option value="nombreVisites">Nombre de visites</option>
          </select>
        </label>
      </div>

      {restaurants.length === 0 && (
        <p className="list-empty">Aucun restaurant enregistré.</p>
      )}
      {restaurants.length > 0 && sorted.length === 0 && (
        <p className="list-empty">
          Aucun restaurant ne correspond à la recherche.
        </p>
      )}

      {sorted.length > 0 && (
        <div className="restaurant-cards">
          {sorted.map((item) => (
            <RestaurantCard
              key={item.restaurant.id}
              aggregate={item}
              onEditRestaurant={onEditRestaurant}
              onRestaurantDeleted={onRestaurantDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RestaurantsList
