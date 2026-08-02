import { describe, expect, it } from 'vitest'
import type { Visite } from '../api/types.ts'
import {
  averageNoteForUserRestaurant,
  hasVisiteByUser,
  meetsRatingThreshold,
} from './visites.ts'

function visite(
  id: string,
  utilisateurId: string,
  options: { restaurantId?: string; note?: number } = {},
): Visite {
  return {
    id,
    restaurantId: options.restaurantId ?? 'restaurant-1',
    date: '2026-08-01',
    note: options.note ?? 4,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId,
    utilisateurNomAffiche: 'Quelqu\'un',
  }
}

describe('hasVisiteByUser', () => {
  it("renvoie true si l'utilisateur a au moins une visite", () => {
    const visites = [visite('v1', 'user-a'), visite('v2', 'user-b')]
    expect(hasVisiteByUser(visites, 'user-a')).toBe(true)
  })

  it("renvoie false si l'utilisateur n'a aucune visite", () => {
    const visites = [visite('v1', 'user-b')]
    expect(hasVisiteByUser(visites, 'user-a')).toBe(false)
  })

  it('renvoie false pour une liste vide', () => {
    expect(hasVisiteByUser([], 'user-a')).toBe(false)
  })
})

describe('meetsRatingThreshold', () => {
  it("correspond à tout quand aucun seuil n'est sélectionné (0)", () => {
    expect(meetsRatingThreshold(null, 0)).toBe(true)
    expect(meetsRatingThreshold(2.5, 0)).toBe(true)
  })

  it('renvoie false si la moyenne est inconnue et un seuil est sélectionné', () => {
    expect(meetsRatingThreshold(null, 3)).toBe(false)
  })

  it('compare la moyenne au seuil', () => {
    expect(meetsRatingThreshold(4, 4)).toBe(true)
    expect(meetsRatingThreshold(3.9, 4)).toBe(false)
    expect(meetsRatingThreshold(5, 4)).toBe(true)
  })
})

describe('averageNoteForUserRestaurant', () => {
  it("renvoie null si l'utilisateur n'a aucune visite sur ce restaurant", () => {
    const visites = [visite('v1', 'user-b', { restaurantId: 'resto-1' })]
    expect(averageNoteForUserRestaurant(visites, 'user-a', 'resto-1')).toBeNull()
  })

  it("ignore les visites d'un autre restaurant", () => {
    const visites = [
      visite('v1', 'user-a', { restaurantId: 'resto-1', note: 5 }),
      visite('v2', 'user-a', { restaurantId: 'resto-2', note: 1 }),
    ]
    expect(averageNoteForUserRestaurant(visites, 'user-a', 'resto-1')).toBe(5)
  })

  it("ignore les visites d'un autre utilisateur sur le même restaurant", () => {
    const visites = [
      visite('v1', 'user-a', { restaurantId: 'resto-1', note: 5 }),
      visite('v2', 'user-b', { restaurantId: 'resto-1', note: 1 }),
    ]
    expect(averageNoteForUserRestaurant(visites, 'user-a', 'resto-1')).toBe(5)
  })

  it('fait la moyenne de plusieurs visites du même utilisateur sur le même restaurant', () => {
    const visites = [
      visite('v1', 'user-a', { restaurantId: 'resto-1', note: 5 }),
      visite('v2', 'user-a', { restaurantId: 'resto-1', note: 3 }),
    ]
    expect(averageNoteForUserRestaurant(visites, 'user-a', 'resto-1')).toBe(4)
  })
})
