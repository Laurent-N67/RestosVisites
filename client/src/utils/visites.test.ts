import { describe, expect, it } from 'vitest'
import type { UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import {
  averageNoteForUserRestaurant,
  estFavoriDeUtilisateur,
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
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
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

function utilisateurAvecFavoris(
  id: string,
  restaurantIds: string[],
): UtilisateurAvecFavoris {
  return {
    id,
    email: `${id}@example.com`,
    nomAffiche: id,
    role: Role.Simple,
    favoris: restaurantIds.map((restaurantId) => ({
      restaurantId,
      restaurantNom: restaurantId,
      dateAjout: '2026-08-01',
    })),
  }
}

describe('estFavoriDeUtilisateur', () => {
  it("renvoie true si le restaurant est dans les favoris de l'utilisateur", () => {
    const utilisateurs = [utilisateurAvecFavoris('user-a', ['resto-1', 'resto-2'])]
    expect(estFavoriDeUtilisateur(utilisateurs, 'user-a', 'resto-2')).toBe(true)
  })

  it("renvoie false si le restaurant n'est pas dans les favoris de l'utilisateur", () => {
    const utilisateurs = [utilisateurAvecFavoris('user-a', ['resto-1'])]
    expect(estFavoriDeUtilisateur(utilisateurs, 'user-a', 'resto-2')).toBe(false)
  })

  it("renvoie false si l'utilisateur est introuvable", () => {
    const utilisateurs = [utilisateurAvecFavoris('user-b', ['resto-1'])]
    expect(estFavoriDeUtilisateur(utilisateurs, 'user-a', 'resto-1')).toBe(false)
  })

  it('ignore les favoris des autres utilisateurs', () => {
    const utilisateurs = [
      utilisateurAvecFavoris('user-a', []),
      utilisateurAvecFavoris('user-b', ['resto-1']),
    ]
    expect(estFavoriDeUtilisateur(utilisateurs, 'user-a', 'resto-1')).toBe(false)
  })
})
