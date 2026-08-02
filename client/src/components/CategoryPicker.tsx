import { useMemo, useState } from 'react'
import type { Categorie } from '../api/types.ts'
import { groupCategories } from '../utils/categories.ts'

interface CategoryPickerProps {
  categories: Categorie[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function CategoryPicker({ categories, selectedIds, onChange }: CategoryPickerProps) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => groupCategories(categories), [categories])
  const selected = new Set(selectedIds)

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery.length === 0) {
      return groups
    }
    return groups
      .map<[string, Categorie[]]>(([groupe, list]) => [
        groupe,
        list.filter((categorie) =>
          categorie.nom.toLowerCase().includes(normalizedQuery),
        ),
      ])
      .filter(([, list]) => list.length > 0)
  }, [groups, query])

  function toggle(id: string) {
    if (selected.has(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (groups.length === 0) {
    return null
  }

  return (
    <div className="category-picker">
      <input
        type="search"
        className="category-filter-search"
        placeholder="Rechercher une catégorie…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filteredGroups.length === 0 && (
        <p className="category-filter-empty">
          Aucune catégorie ne correspond à la recherche.
        </p>
      )}

      {filteredGroups.map(([groupe, groupCategoriesList]) => (
        <div key={groupe} className="category-picker-group">
          <p className="category-picker-group-title">{groupe}</p>
          <ul className="chips category-picker-chips">
            {groupCategoriesList.map((categorie) => (
              <li key={categorie.id}>
                <button
                  type="button"
                  className={
                    selected.has(categorie.id)
                      ? 'chip-filter chip-filter--active'
                      : 'chip-filter'
                  }
                  aria-pressed={selected.has(categorie.id)}
                  onClick={() => toggle(categorie.id)}
                >
                  {categorie.nom}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default CategoryPicker
