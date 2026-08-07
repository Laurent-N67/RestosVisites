import { describe, expect, it } from 'vitest'
import type { Categorie, Restaurant, Visite } from '../api/types.ts'
import { calculerRecommandations } from './recommandations.ts'

const italien: Categorie = { id: 'cat-italien', nom: 'Italien', groupe: 'Type de cuisine' }
const japonais: Categorie = { id: 'cat-japonais', nom: 'Japonais', groupe: 'Type de cuisine' }
const gastro: Categorie = { id: 'cat-gastro', nom: 'Gastronomique', groupe: "Style d'établissement" }

function restaurant(
  id: string,
  categories: Categorie[],
  options: { latitude?: number; longitude?: number } = {},
): Restaurant {
  return {
    id,
    nom: id,
    adresse: `Adresse ${id}`,
    latitude: options.latitude ?? 48.85,
    longitude: options.longitude ?? 2.35,
    categories,
    description: null,
    telephone: null,
    siteWeb: null,
    horaires: null,
    photos: [],
  }
}

function visite(restaurantId: string, utilisateurId: string): Visite {
  return {
    id: `visite-${restaurantId}-${utilisateurId}`,
    restaurantId,
    date: '2026-08-01',
    note: 4,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId,
    utilisateurNomAffiche: 'Quelqu\'un',
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
  }
}

describe('calculerRecommandations', () => {
  it("renvoie un tableau vide si l'utilisateur n'a ni favori ni visite (aucun signal)", () => {
    const restaurants = [restaurant('resto-1', [italien]), restaurant('resto-2', [italien])]

    const result = calculerRecommandations(
      restaurants,
      [],
      new Set(),
      'user-a',
      undefined,
    )

    expect(result).toEqual([])
  })

  it('exclut un candidat qui ne partage aucune catégorie avec les restaurants aimés', () => {
    const restaurants = [
      restaurant('resto-aime', [italien]),
      restaurant('resto-candidat', [gastro]),
    ]
    const visites = [visite('resto-aime', 'user-a')]

    const result = calculerRecommandations(
      restaurants,
      visites,
      new Set(),
      'user-a',
      undefined,
    )

    expect(result).toEqual([])
  })

  it("exclut les restaurants déjà favoris ou déjà visités par l'utilisateur", () => {
    const restaurants = [
      restaurant('resto-favori', [italien]),
      restaurant('resto-visite', [italien]),
      restaurant('resto-candidat', [italien]),
    ]
    const visites = [visite('resto-visite', 'user-a')]

    const result = calculerRecommandations(
      restaurants,
      visites,
      new Set(['resto-favori']),
      'user-a',
      undefined,
    )

    expect(result.map((r) => r.restaurant.id)).toEqual(['resto-candidat'])
  })

  it('trie par nombre de catégories en commun décroissant', () => {
    const restaurants = [
      restaurant('resto-aime', [italien, japonais, gastro]),
      restaurant('resto-1-commune', [italien]),
      restaurant('resto-2-communes', [italien, japonais]),
    ]
    const visites = [visite('resto-aime', 'user-a')]

    const result = calculerRecommandations(
      restaurants,
      visites,
      new Set(),
      'user-a',
      undefined,
    )

    expect(result.map((r) => r.restaurant.id)).toEqual([
      'resto-2-communes',
      'resto-1-commune',
    ])
  })

  it('utilise la distance comme critère de départage à nombre de catégories communes égal', () => {
    const restaurants = [
      restaurant('resto-aime', [italien]),
      restaurant('resto-loin', [italien], { latitude: 45.75, longitude: 4.85 }), // Lyon
      restaurant('resto-proche', [italien], { latitude: 48.86, longitude: 2.36 }), // Paris, tout proche
    ]
    const visites = [visite('resto-aime', 'user-a')]
    const position = { latitude: 48.85, longitude: 2.35 } // Paris

    const result = calculerRecommandations(
      restaurants,
      visites,
      new Set(),
      'user-a',
      position,
      2,
    )

    expect(result.map((r) => r.restaurant.id)).toEqual(['resto-proche', 'resto-loin'])
    expect(result[0].distanceKm).not.toBeNull()
    expect(result[0].distanceKm!).toBeLessThan(result[1].distanceKm!)
  })

  it('retombe sur un tri par catégories seules sans lever d\'erreur quand la position est absente', () => {
    const restaurants = [
      restaurant('resto-aime', [italien, japonais]),
      restaurant('resto-1-commune', [italien]),
      restaurant('resto-2-communes', [italien, japonais]),
    ]
    const visites = [visite('resto-aime', 'user-a')]

    const result = calculerRecommandations(
      restaurants,
      visites,
      new Set(),
      'user-a',
      undefined,
    )

    expect(result.map((r) => r.restaurant.id)).toEqual([
      'resto-2-communes',
      'resto-1-commune',
    ])
    expect(result.every((r) => r.distanceKm === null)).toBe(true)
  })

  it('respecte la limite fournie', () => {
    const restaurants = [
      restaurant('resto-aime', [italien]),
      restaurant('resto-1', [italien]),
      restaurant('resto-2', [italien]),
      restaurant('resto-3', [italien]),
    ]
    const visites = [visite('resto-aime', 'user-a')]

    const result = calculerRecommandations(
      restaurants,
      visites,
      new Set(),
      'user-a',
      undefined,
      1,
    )

    expect(result).toHaveLength(1)
  })
})
