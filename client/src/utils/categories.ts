import type { Categorie } from '../api/types.ts'

const GROUP_ORDER = [
  'Gamme de prix',
  'Type de cuisine',
  "Style d'établissement",
  'Autres caractéristiques',
]

/**
 * Regroupe des catégories par `groupe`, dans l'ordre fixe attendu par le
 * catalogue (fallback alphabétique pour un groupe inconnu), avec les
 * catégories de chaque groupe triées par `nom`.
 */
export function groupCategories(categories: Categorie[]): [string, Categorie[]][] {
  const groups = new Map<string, Categorie[]>()
  for (const categorie of categories) {
    const list = groups.get(categorie.groupe)
    if (list) {
      list.push(categorie)
    } else {
      groups.set(categorie.groupe, [categorie])
    }
  }

  const entries = Array.from(groups.entries())
  for (const [, list] of entries) {
    list.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }

  entries.sort(([a], [b]) => {
    const indexA = GROUP_ORDER.indexOf(a)
    const indexB = GROUP_ORDER.indexOf(b)
    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b, 'fr')
    }
    if (indexA === -1) {
      return 1
    }
    if (indexB === -1) {
      return -1
    }
    return indexA - indexB
  })

  return entries
}

/**
 * Détermine si un ensemble de catégories (celles d'un restaurant) satisfait
 * les filtres sélectionnés : TOUTES les catégories sélectionnées doivent
 * être présentes (ET strict, y compris entre deux catégories d'un même
 * groupe — sélectionner "Créole" et "50–70€" doit ne garder que les
 * restaurants créoles ET dans cette tranche de prix). Un filtre vide
 * correspond à tout.
 */
export function matchesCategoryFilters(
  itemCategoryIds: Set<string>,
  selectedIds: Set<string>,
): boolean {
  return Array.from(selectedIds).every((id) => itemCategoryIds.has(id))
}
