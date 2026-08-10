import { useEffect, useMemo, useRef, useState } from 'react'
import type { Categorie } from '../api/types.ts'
import { groupColorKey } from '../utils/categoryColors.ts'

interface CategoryFilterDropdownProps {
  categoriesGrouped: [string, Categorie[]][]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
}

function CategoryFilterDropdown({
  categoriesGrouped,
  selectedIds,
  onToggle,
  onClear,
}: CategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredGrouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery.length === 0) {
      return categoriesGrouped
    }
    return categoriesGrouped
      .map<[string, Categorie[]]>(([groupe, list]) => [
        groupe,
        list.filter((categorie) =>
          categorie.nom.toLowerCase().includes(normalizedQuery),
        ),
      ])
      .filter(([, list]) => list.length > 0)
  }, [categoriesGrouped, query])

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleToggleOpen() {
    setOpen((prev) => {
      const next = !prev
      if (!next) {
        setQuery('')
      }
      return next
    })
  }

  if (categoriesGrouped.length === 0) {
    return null
  }

  return (
    <div className="category-filter-dropdown" ref={containerRef}>
      <button
        type="button"
        className="category-filter-trigger"
        aria-expanded={open}
        onClick={handleToggleOpen}
      >
        Catégories
        {selectedIds.size > 0 && (
          <span className="category-filter-badge">{selectedIds.size}</span>
        )}
      </button>

      {open && (
        <>
          <div
            className="category-filter-backdrop"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="category-filter-panel">
            <div className="category-filter-panel-header">
              <input
                type="search"
                className="category-filter-search"
                placeholder="Rechercher une catégorie…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="category-filter-close"
                aria-label="Fermer le filtre de catégories"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            {selectedIds.size > 0 && (
              <button
                type="button"
                className="category-filter-reset"
                onClick={onClear}
              >
                Réinitialiser
              </button>
            )}

            <div className="category-filter-groups">
              {filteredGrouped.length === 0 && (
                <p className="category-filter-empty">
                  Aucune catégorie ne correspond à la recherche.
                </p>
              )}
              {filteredGrouped.map(([groupe, groupCategoriesList]) => {
                const colorKey = groupColorKey(groupe)
                return (
                  <div key={groupe} className="category-filter-group">
                    <p className="category-filter-group-title">{groupe}</p>
                    <ul className="chips list-category-filters-group">
                      {groupCategoriesList.map((categorie) => (
                        <li key={categorie.id}>
                          <button
                            type="button"
                            className={
                              selectedIds.has(categorie.id)
                                ? `chip-filter chip-filter--${colorKey} chip-filter--active`
                                : `chip-filter chip-filter--${colorKey}`
                            }
                            aria-pressed={selectedIds.has(categorie.id)}
                            onClick={() => onToggle(categorie.id)}
                          >
                            {categorie.nom}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CategoryFilterDropdown
