import { useEffect, useMemo, useRef, useState } from 'react'
import type { Categorie } from '../api/types.ts'
import { groupColorKey } from '../utils/categoryColors.ts'

interface CategoryGroupDropdownProps {
  groupe: string
  categories: Categorie[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

function CategoryGroupDropdown({
  groupe,
  categories,
  selectedIds,
  onToggle,
}: CategoryGroupDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const colorKey = groupColorKey(groupe)

  const selectedCount = useMemo(
    () => categories.filter((categorie) => selectedIds.has(categorie.id)).length,
    [categories, selectedIds],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery.length === 0) {
      return categories
    }
    return categories.filter((categorie) =>
      categorie.nom.toLowerCase().includes(normalizedQuery),
    )
  }, [categories, query])

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

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="category-filter-dropdown" ref={containerRef}>
      <button
        type="button"
        className={`category-filter-trigger category-group-trigger--${colorKey}`}
        aria-expanded={open}
        onClick={handleToggleOpen}
      >
        {groupe}
        {selectedCount > 0 && (
          <span className="category-filter-badge">{selectedCount}</span>
        )}
      </button>

      {open && (
        <div className="category-filter-panel">
          <div className="category-filter-panel-header">
            <input
              type="search"
              className="category-filter-search"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="category-filter-close"
              aria-label={`Fermer le groupe ${groupe}`}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="category-filter-empty">
              Aucune catégorie ne correspond à la recherche.
            </p>
          ) : (
            <ul className="chips list-category-filters-group">
              {filtered.map((categorie) => (
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
          )}
        </div>
      )}

      {!open && selectedCount > 0 && (
        <ul className="category-filter-selected chips">
          {categories
            .filter((categorie) => selectedIds.has(categorie.id))
            .map((categorie) => (
              <li key={categorie.id}>
                <button
                  type="button"
                  className={`chip-filter chip-filter--${colorKey} chip-filter--active chip-filter--removable`}
                  onClick={() => onToggle(categorie.id)}
                  aria-label={`Retirer le filtre ${categorie.nom}`}
                >
                  {categorie.nom}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export default CategoryGroupDropdown
