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
 * Regroupe des ids de catégories sélectionnées par `groupe`, à partir d'une
 * map id -> groupe (voir `groupCategories`). Les ids sans groupe connu sont
 * ignorés.
 */
export function groupSelectedIdsByGroupe(
  selectedIds: Set<string>,
  categorieGroupeById: Map<string, string>,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const id of selectedIds) {
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
}

/**
 * Détermine si un ensemble de catégories (celles d'un restaurant) satisfait
 * les filtres sélectionnés : il faut correspondre à au moins une catégorie
 * sélectionnée de CHAQUE groupe représenté (ET entre groupes, ex. prix et
 * cuisine), mais une seule des catégories sélectionnées au sein d'un même
 * groupe suffit (OU entre deux cuisines par exemple). Un filtre vide
 * correspond à tout.
 */
export function matchesCategoryFilters(
  itemCategoryIds: Set<string>,
  selectedIdsByGroupe: Map<string, Set<string>>,
): boolean {
  return Array.from(selectedIdsByGroupe.values()).every((idsDuGroupe) =>
    Array.from(idsDuGroupe).some((id) => itemCategoryIds.has(id)),
  )
}
