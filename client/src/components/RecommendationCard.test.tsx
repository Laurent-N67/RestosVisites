import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Restaurant, Visite } from '../api/types.ts'
import type { RestaurantRecommande } from '../utils/recommandations.ts'
import RecommendationCard from './RecommendationCard.tsx'

const restaurant: Restaurant = {
  id: 'restaurant-1',
  nom: 'Le Bon Coin',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

const categorie = { id: 'cat-1', nom: 'Italien', groupe: 'Type de cuisine' }

function makeVisite(overrides: Partial<Visite>): Visite {
  return {
    id: 'visite-x',
    restaurantId: restaurant.id,
    date: '2026-01-01',
    note: 4,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: 'user-1',
    utilisateurNomAffiche: 'Une Personne',
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
    ...overrides,
  }
}

function renderCard(
  recommandation: RestaurantRecommande,
  visites: Visite[] = [],
  compact = false,
) {
  return render(
    <MemoryRouter>
      <RecommendationCard recommandation={recommandation} visites={visites} compact={compact} />
    </MemoryRouter>,
  )
}

describe('RecommendationCard', () => {
  it('affiche le nom, l\'adresse, les catégories communes et un lien vers la fiche', () => {
    renderCard({ restaurant, categoriesCommunes: [categorie], distanceKm: null, score: 75 })

    expect(screen.getByText('Le Bon Coin')).toBeInTheDocument()
    expect(screen.getByText('1 rue de Paris')).toBeInTheDocument()
    expect(screen.getByText('Italien')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Voir la fiche complète' }),
    ).toHaveAttribute('href', '/restaurants/restaurant-1')
  })

  it('affiche la distance formatée quand elle est disponible', () => {
    renderCard({ restaurant, categoriesCommunes: [categorie], distanceKm: 3.4, score: 75 })

    expect(screen.getByText(/3[.,]4/)).toBeInTheDocument()
  })

  it("n'affiche aucune distance quand elle vaut null", () => {
    renderCard({ restaurant, categoriesCommunes: [categorie], distanceKm: null, score: 75 })

    expect(document.querySelector('.recommandation-distance')).not.toBeInTheDocument()
  })

  it('utilise la photo de la visite la plus récente du restaurant comme couverture', () => {
    const visites = [
      makeVisite({ id: 'v1', date: '2026-01-01', urlsPhotos: ['ancienne.jpg'] }),
      makeVisite({ id: 'v2', date: '2026-06-01', urlsPhotos: ['recente.jpg'] }),
    ]
    renderCard({ restaurant, categoriesCommunes: [categorie], distanceKm: null, score: 75 }, visites)

    expect(screen.getByAltText('Le Bon Coin')).toHaveAttribute('src', 'recente.jpg')
  })

  it('affiche le score de compatibilité en variante compacte', () => {
    renderCard({ restaurant, categoriesCommunes: [categorie], distanceKm: null, score: 92 }, [], true)

    expect(screen.getByText('92% compatible')).toBeInTheDocument()
  })
})
