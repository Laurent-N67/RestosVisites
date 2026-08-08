import type { Categorie } from '../api/types.ts'
import { groupColorKey } from '../utils/categoryColors.ts'

interface CategoryBadgesProps {
  categories: Categorie[]
  max?: number
}

function CategoryBadges({ categories, max = 3 }: CategoryBadgesProps) {
  const visible = categories.slice(0, max)
  const overflow = categories.length - max

  return (
    <div className="category-badges">
      {visible.map((categorie) => (
        <span
          key={categorie.id}
          className={`category-badge category-badge--${groupColorKey(categorie.groupe)}`}
        >
          {categorie.nom}
        </span>
      ))}
      {overflow > 0 && (
        <span className="category-badge category-badge--overflow">
          +{overflow}
        </span>
      )}
    </div>
  )
}

export default CategoryBadges
