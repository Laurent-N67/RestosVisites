import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Categorie, Restaurant, Visite } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import {
  groupCategories,
  groupSelectedIdsByGroupe,
  matchesCategoryFilters,
} from '../utils/categories.ts'
import { groupColorKey } from '../utils/categoryColors.ts'
import { averageNote, hasVisiteByUser, meetsRatingThreshold } from '../utils/visites.ts'
import { photoPrincipale } from '../utils/restaurants.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { formatNoteMoyenne, stars } from '../utils/format.ts'
import CategoryFilterDropdown from './CategoryFilterDropdown.tsx'
import CategoryBadges from './CategoryBadges.tsx'
import CoverPhoto from './CoverPhoto.tsx'
import { HeartIcon } from './icons/Icons.tsx'

interface RestaurantsListProps {
  restaurants: Restaurant[]
  visites: Visite[]
}

type SortOption = 'nom' | 'derniereVisite' | 'nombreVisites'
type VisitedFilter = 'tous' | 'visite' | 'nonVisite'

const PAGE_SIZE = 12
const GROUPE_PRIX = 'Gamme de prix'

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

    return {
      restaurant,
      count: restaurantVisites.length,
      lastVisite,
      categories,
      averageNote: averageNote(restaurantVisites),
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
}

function RestaurantCard({ aggregate: item }: RestaurantCardProps) {
  const { user } = useAuth()
  const {
    isFavori,
    loading: favoriLoading,
    pending: favoriPending,
    error: favoriError,
    toggle: toggleFavori,
  } = useFavoriToggle(item.restaurant.id)
  const { restaurant, count, categories, averageNote: average } = item
  const cover = photoPrincipale(restaurant)

  return (
    <article className="restaurant-card card card--interactive">
      <div className="restaurant-card-thumb">
        <CoverPhoto url={cover?.url} alt={restaurant.nom} />
        {user && (
          <button
            type="button"
            className={
              isFavori
                ? 'restaurant-card-favori restaurant-card-favori--active'
                : 'restaurant-card-favori'
            }
            disabled={favoriLoading || favoriPending}
            aria-label={
              isFavori
                ? `Retirer ${restaurant.nom} des favoris`
                : `Ajouter ${restaurant.nom} aux favoris`
            }
            onClick={() => void toggleFavori()}
          >
            <HeartIcon fill={isFavori ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="popup-header">
        <h3>{restaurant.nom}</h3>
      </div>

      <p className="popup-adresse">{restaurant.adresse}</p>

      {favoriError && <p className="popup-status popup-error">{favoriError}</p>}

      {count > 0 && average !== null ? (
        <div className="list-card-rating">
          <span className="list-card-rating-value">
            {formatNoteMoyenne(average)}
          </span>
          <span
            className="popup-stars"
            aria-label={`Note moyenne ${formatNoteMoyenne(average)} sur 5`}
          >
            {stars(Math.round(average))}
          </span>
          <span className="list-card-rating-count">
            ({count} {count > 1 ? 'visites' : 'visite'})
          </span>
        </div>
      ) : (
        <p className="popup-status">Aucune visite enregistrée.</p>
      )}

      {categories.length > 0 && <CategoryBadges categories={categories} />}

      <Link className="popup-directions" to={`/restaurants/${restaurant.id}`}>
        Voir la fiche
      </Link>
    </article>
  )
}

function RestaurantsList({ restaurants, visites }: RestaurantsListProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )
  const [sortOption, setSortOption] = useState<SortOption>('nom')
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('tous')
  const [minNote, setMinNote] = useState(0)
  const [page, setPage] = useState(1)

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

  const categoriesGroupedSansPrix = useMemo(
    () => allCategoriesGrouped.filter(([groupe]) => groupe !== GROUPE_PRIX),
    [allCategoriesGrouped],
  )

  const categoriesPrix = useMemo(
    () => allCategoriesGrouped.find(([groupe]) => groupe === GROUPE_PRIX)?.[1] ?? [],
    [allCategoriesGrouped],
  )

  const categoriesSansPrixById = useMemo(() => {
    const map = new Map<string, Categorie>()
    for (const [, list] of categoriesGroupedSansPrix) {
      for (const categorie of list) {
        map.set(categorie.id, categorie)
      }
    }
    return map
  }, [categoriesGroupedSansPrix])

  const selectedNonPrixCategories = useMemo(
    () =>
      Array.from(selectedCategories)
        .map((id) => categoriesSansPrixById.get(id))
        .filter((categorie): categorie is Categorie => categorie !== undefined),
    [selectedCategories, categoriesSansPrixById],
  )

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

  useEffect(() => {
    setPage(1)
  }, [search, selectedCategories, visitedFilter, minNote, sortOption])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div className="restaurants-list-view">
      <div className="restaurants-list-header">
        <h1>Tous les restaurants</h1>
        <p>
          {sorted.length} résultat{sorted.length > 1 ? 's' : ''} trouvé
          {sorted.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="list-controls">
        <input
          type="search"
          className="list-search"
          placeholder="Rechercher un restaurant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <CategoryFilterDropdown
          categoriesGrouped={categoriesGroupedSansPrix}
          selectedIds={selectedCategories}
          onToggle={toggleCategory}
          onClear={clearCategories}
        />

        {categoriesPrix.length > 0 && (
          <ul className="chips list-category-filters-group">
            {categoriesPrix.map((categorie) => (
              <li key={categorie.id}>
                <button
                  type="button"
                  className={
                    selectedCategories.has(categorie.id)
                      ? `chip-filter chip-filter--${groupColorKey(GROUPE_PRIX)} chip-filter--active`
                      : `chip-filter chip-filter--${groupColorKey(GROUPE_PRIX)}`
                  }
                  aria-pressed={selectedCategories.has(categorie.id)}
                  onClick={() => toggleCategory(categorie.id)}
                >
                  {categorie.nom}
                </button>
              </li>
            ))}
          </ul>
        )}

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

      {selectedNonPrixCategories.length > 0 && (
        <ul className="category-filter-selected chips">
          {selectedNonPrixCategories.map((categorie) => (
            <li key={categorie.id}>
              <button
                type="button"
                className={`chip-filter chip-filter--${groupColorKey(categorie.groupe)} chip-filter--active chip-filter--removable`}
                onClick={() => toggleCategory(categorie.id)}
                aria-label={`Retirer le filtre ${categorie.nom}`}
              >
                {categorie.nom}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {restaurants.length === 0 && (
        <p className="list-empty">Aucun restaurant enregistré.</p>
      )}
      {restaurants.length > 0 && sorted.length === 0 && (
        <p className="list-empty">
          Aucun restaurant ne correspond à la recherche.
        </p>
      )}

      {paginated.length > 0 && (
        <div className="restaurant-cards">
          {paginated.map((item) => (
            <RestaurantCard key={item.restaurant.id} aggregate={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="list-pagination">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Précédent
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}

export default RestaurantsList
