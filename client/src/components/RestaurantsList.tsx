import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Categorie, Restaurant, Visite } from '../api/types.ts'
import { groupCategories } from '../utils/categories.ts'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { formatDate, stars } from '../utils/format.ts'
import CategoryFilterDropdown from './CategoryFilterDropdown.tsx'

interface RestaurantsListProps {
  restaurants: Restaurant[]
  visites: Visite[]
  onEditRestaurant: (restaurant: Restaurant) => void
  onRestaurantDeleted: () => void
}

type SortOption = 'nom' | 'derniereVisite' | 'nombreVisites'

interface RestaurantAggregate {
  restaurant: Restaurant
  count: number
  lastVisite: Visite | null
  categories: Categorie[]
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
  const { deleting, error, handleDelete } =
    useDeleteRestaurant(onRestaurantDeleted)
  const { restaurant, count, lastVisite, categories } = item

  return (
    <article className="restaurant-card">
      <div className="popup-header">
        <h3>{restaurant.nom}</h3>
        <div className="popup-actions">
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
        </div>
      </div>

      <p className="popup-adresse">{restaurant.adresse}</p>
      {error && <p className="popup-status popup-error">{error}</p>}

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
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )
  const [sortOption, setSortOption] = useState<SortOption>('nom')

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

  // Catégories sélectionnées, regroupées par `groupe` : un restaurant doit
  // correspondre à au moins une catégorie sélectionnée de CHAQUE groupe
  // représenté (ET entre groupes, ex. prix et cuisine), mais il suffit qu'il
  // corresponde à une seule des catégories sélectionnées au sein d'un même
  // groupe (OU entre deux cuisines par exemple).
  const selectedIdsByGroupe = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const id of selectedCategories) {
      const groupe = categorieGroupeById.get(id)
      if (!groupe) {
        continue
      }
      const set = map.get(groupe)
      if (set) {
        set.add(id)
      } else {
        map.set(groupe, new Set([id]))
      }
    }
    return map
  }, [selectedCategories, categorieGroupeById])

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
      const matchesCategory = Array.from(selectedIdsByGroupe.values()).every(
        (idsDuGroupe) =>
          Array.from(idsDuGroupe).some((id) => itemCategoryIds.has(id)),
      )
      return matchesSearch && matchesCategory
    })
  }, [aggregates, search, selectedIdsByGroupe])

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
