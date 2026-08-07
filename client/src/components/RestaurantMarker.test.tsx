import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapContainer } from 'react-leaflet'
import { describe, expect, it, vi } from 'vitest'
import type { Restaurant } from '../api/types.ts'
import RestaurantMarker from './RestaurantMarker.tsx'
import '../leaflet-icon-fix.ts'

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

function renderMarker(
  props: Partial<React.ComponentProps<typeof RestaurantMarker>> = {},
) {
  const defaultProps: React.ComponentProps<typeof RestaurantMarker> = {
    restaurant,
    noteSummary: null,
    onSelect: vi.fn(),
  }
  return render(
    <MapContainer center={[48.85, 2.35]} zoom={13}>
      <RestaurantMarker {...defaultProps} {...props} />
    </MapContainer>,
  )
}

describe('RestaurantMarker', () => {
  it('affiche le nom du restaurant en étiquette permanente', () => {
    renderMarker()

    expect(screen.getByText('Le Bon Coin')).toBeInTheDocument()
  })

  it('affiche la note moyenne dans l\'étiquette quand elle est fournie', () => {
    renderMarker({ noteSummary: { average: 4.2, count: 3 } })

    expect(document.querySelector('.restaurant-label-note')).toBeInTheDocument()
  })

  it("n'affiche pas de note dans l'étiquette quand aucune n'est fournie", () => {
    renderMarker({ noteSummary: null })

    expect(document.querySelector('.restaurant-label-note')).not.toBeInTheDocument()
  })

  it("appelle onSelect avec l'id du restaurant au clic sur le marqueur", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderMarker({ onSelect })

    const marker = document.querySelector('.leaflet-marker-icon')
    expect(marker).not.toBeNull()
    await user.click(marker as Element)

    expect(onSelect).toHaveBeenCalledWith('restaurant-1')
  })

  it('ne rend plus de Popup au clic (supprimée au profit du panneau de détail)', async () => {
    const user = userEvent.setup()
    renderMarker()

    const marker = document.querySelector('.leaflet-marker-icon')
    await user.click(marker as Element)

    expect(document.querySelector('.leaflet-popup')).not.toBeInTheDocument()
  })

  it('utilise l\'icône orange distincte quand le restaurant est recommandé, l\'icône par défaut sinon', () => {
    // L'icône propre au marqueur (RECOMMENDED_ICON vs DEFAULT_ICON) est
    // gérée par RestaurantMarker lui-même, indépendamment du groupe de
    // clustering (Phase 7b) qui l'englobe dans RestaurantsMap — inutile de
    // passer par MarkerClusterGroup pour vérifier cette sélection d'icône.
    const { unmount } = renderMarker({ highlighted: true })
    expect(document.querySelector('.recommended-marker')).toBeInTheDocument()
    unmount()

    renderMarker({ highlighted: false })
    expect(document.querySelector('.recommended-marker')).not.toBeInTheDocument()
  })

  it('signale la ref du marqueur via onMarkerRef au montage puis au démontage', () => {
    const onMarkerRef = vi.fn()
    const { unmount } = renderMarker({ onMarkerRef })

    expect(onMarkerRef).toHaveBeenCalledWith(
      'restaurant-1',
      expect.anything(),
    )

    onMarkerRef.mockClear()
    unmount()

    expect(onMarkerRef).toHaveBeenCalledWith('restaurant-1', null)
  })
})
