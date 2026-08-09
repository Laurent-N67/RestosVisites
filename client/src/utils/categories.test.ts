import { describe, expect, it } from 'vitest'
import type { Categorie } from '../api/types.ts'
import { groupCategories, matchesCategoryFilters } from './categories.ts'

function categorie(id: string, nom: string, groupe: string): Categorie {
  return { id, nom, groupe }
}

describe('groupCategories', () => {
  it('regroupe par groupe, dans l\'ordre fixe attendu', () => {
    const categories = [
      categorie('1', 'Italien', 'Type de cuisine'),
      categorie('2', '€€', 'Gamme de prix'),
      categorie('3', 'Bar à vin', "Style d'établissement"),
      categorie('4', 'Terrasse', 'Autres caractéristiques'),
    ]

    const groups = groupCategories(categories)

    expect(groups.map(([groupe]) => groupe)).toEqual([
      'Gamme de prix',
      'Type de cuisine',
      "Style d'établissement",
      'Autres caractéristiques',
    ])
  })

  it('trie les catégories de chaque groupe par nom', () => {
    const categories = [
      categorie('1', 'Japonais', 'Type de cuisine'),
      categorie('2', 'Français', 'Type de cuisine'),
      categorie('3', 'Coréen', 'Type de cuisine'),
    ]

    const [[, cuisines]] = groupCategories(categories)

    expect(cuisines.map((c) => c.nom)).toEqual([
      'Coréen',
      'Français',
      'Japonais',
    ])
  })

  it('place les groupes inconnus après les groupes connus, triés alphabétiquement', () => {
    const categories = [
      categorie('1', 'X', 'Zzz Groupe Inconnu'),
      categorie('2', 'Y', 'Gamme de prix'),
      categorie('3', 'Z', 'Ambiance'),
    ]

    const groups = groupCategories(categories)

    expect(groups.map(([groupe]) => groupe)).toEqual([
      'Gamme de prix',
      'Ambiance',
      'Zzz Groupe Inconnu',
    ])
  })

  it('renvoie une liste vide pour une entrée vide', () => {
    expect(groupCategories([])).toEqual([])
  })
})

describe('matchesCategoryFilters', () => {
  it("correspond à tout quand aucun filtre n'est sélectionné", () => {
    const itemCategoryIds = new Set(['cuisine-italienne'])
    expect(matchesCategoryFilters(itemCategoryIds, new Set())).toBe(true)
  })

  it('exige la présence de toutes les catégories sélectionnées (ET strict)', () => {
    const selectedIds = new Set(['eur-eur', 'italien'])

    expect(
      matchesCategoryFilters(new Set(['eur-eur', 'italien']), selectedIds),
    ).toBe(true)
    expect(matchesCategoryFilters(new Set(['italien']), selectedIds)).toBe(
      false,
    )
    expect(matchesCategoryFilters(new Set(['eur-eur']), selectedIds)).toBe(
      false,
    )
  })

  it("applique un ET même entre deux catégories du même groupe (ex. deux cuisines)", () => {
    const selectedIds = new Set(['italien', 'japonais'])

    expect(matchesCategoryFilters(new Set(['italien']), selectedIds)).toBe(
      false,
    )
    expect(
      matchesCategoryFilters(new Set(['italien', 'japonais']), selectedIds),
    ).toBe(true)
  })
})
