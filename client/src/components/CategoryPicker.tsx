import type { Categorie } from '../api/types.ts'
import { groupCategories } from '../utils/categories.ts'

interface CategoryPickerProps {
  categories: Categorie[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function CategoryPicker({ categories, selectedIds, onChange }: CategoryPickerProps) {
  const groups = groupCategories(categories)
  const selected = new Set(selectedIds)

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
      {groups.map(([groupe, groupCategoriesList]) => (
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
