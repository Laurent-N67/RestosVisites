import { describe, expect, it } from 'vitest'
import type { Categorie } from '../api/types.ts'
import {
  groupCategories,
  groupSelectedIdsByGroupe,
  matchesCategoryFilters,
} from './categories.ts'

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

describe('groupSelectedIdsByGroupe', () => {
  it('regroupe les ids sélectionnés par groupe', () => {
    const categorieGroupeById = new Map([
      ['prix-1', 'Gamme de prix'],
      ['cuisine-1', 'Type de cuisine'],
      ['cuisine-2', 'Type de cuisine'],
    ])

    const result = groupSelectedIdsByGroupe(
      new Set(['prix-1', 'cuisine-1', 'cuisine-2']),
      categorieGroupeById,
    )

    expect(result.get('Gamme de prix')).toEqual(new Set(['prix-1']))
    expect(result.get('Type de cuisine')).toEqual(
      new Set(['cuisine-1', 'cuisine-2']),
    )
  })

  it('ignore les ids sans groupe connu', () => {
    const result = groupSelectedIdsByGroupe(
      new Set(['inconnu']),
      new Map(),
    )

    expect(result.size).toBe(0)
  })
})

describe('matchesCategoryFilters', () => {
  it("correspond à tout quand aucun filtre n'est sélectionné", () => {
    const itemCategoryIds = new Set(['cuisine-italienne'])
    expect(matchesCategoryFilters(itemCategoryIds, new Map())).toBe(true)
  })

  it('applique un OU entre catégories du même groupe', () => {
    const selectedIdsByGroupe = new Map([
      ['Type de cuisine', new Set(['italien', 'japonais'])],
    ])

    expect(
      matchesCategoryFilters(new Set(['italien']), selectedIdsByGroupe),
    ).toBe(true)
    expect(
      matchesCategoryFilters(new Set(['japonais']), selectedIdsByGroupe),
    ).toBe(true)
    expect(
      matchesCategoryFilters(new Set(['coreen']), selectedIdsByGroupe),
    ).toBe(false)
  })

  it('applique un ET entre groupes différents', () => {
    const selectedIdsByGroupe = new Map([
      ['Gamme de prix', new Set(['eur-eur'])],
      ['Type de cuisine', new Set(['italien', 'japonais'])],
    ])

    expect(
      matchesCategoryFilters(
        new Set(['eur-eur', 'italien']),
        selectedIdsByGroupe,
      ),
    ).toBe(true)
    expect(
      matchesCategoryFilters(new Set(['italien']), selectedIdsByGroupe),
    ).toBe(false)
    expect(
      matchesCategoryFilters(new Set(['eur-eur']), selectedIdsByGroupe),
    ).toBe(false)
  })

  it('combine ET entre groupes et OU au sein d\'un groupe', () => {
    const selectedIdsByGroupe = new Map([
      ['Gamme de prix', new Set(['eur-eur', 'eur'])],
      ['Type de cuisine', new Set(['italien', 'japonais'])],
    ])

    expect(
      matchesCategoryFilters(
        new Set(['eur', 'japonais']),
        selectedIdsByGroupe,
      ),
    ).toBe(true)
    expect(
      matchesCategoryFilters(new Set(['eur']), selectedIdsByGroupe),
    ).toBe(false)
  })
})
