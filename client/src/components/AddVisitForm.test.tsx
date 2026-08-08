import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Compagnie, Reservation } from '../api/types.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import AddVisitForm from './AddVisitForm.tsx'

const { createVisiteMock, updateVisiteMock } = vi.hoisted(() => ({
  createVisiteMock: vi.fn(),
  updateVisiteMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    createVisite: createVisiteMock,
    updateVisite: updateVisiteMock,
  }
})

const restaurants: Restaurant[] = [
  {
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
  },
]

const existingVisite: Visite = {
  id: 'visite-1',
  restaurantId: 'restaurant-1',
  date: '2026-01-15',
  note: 4,
  commentaire: 'Très bon',
  urlsPhotos: [],
  utilisateurId: 'user-1',
  utilisateurNomAffiche: 'Alice',
  avecQui: Compagnie.Couple,
  reservation: Reservation.Oui,
  budget: 42.5,
  tempsAttente: 15,
}

async function goToLastStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
}

describe('AddVisitForm', () => {
  beforeEach(() => {
    createVisiteMock.mockReset()
    updateVisiteMock.mockReset()
  })

  it('sélectionne un pill "Avec qui" et l\'inclut dans le payload de création', async () => {
    createVisiteMock.mockResolvedValue({ id: 'new-visite' })
    const user = userEvent.setup()
    const onSaved = vi.fn()

    render(
      <AddVisitForm
        restaurants={restaurants}
        initialRestaurantId="restaurant-1"
        onSaved={onSaved}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Couple' }))
    await goToLastStep(user)
    await user.click(screen.getByRole('button', { name: 'Enregistrer la visite' }))

    await waitFor(() => expect(createVisiteMock).toHaveBeenCalledTimes(1))
    expect(createVisiteMock).toHaveBeenCalledWith(
      expect.objectContaining({ avecQui: Compagnie.Couple }),
    )
  })

  it('envoie null pour les champs optionnels non renseignés', async () => {
    createVisiteMock.mockResolvedValue({ id: 'new-visite' })
    const user = userEvent.setup()

    render(
      <AddVisitForm
        restaurants={restaurants}
        initialRestaurantId="restaurant-1"
        onSaved={vi.fn()}
      />,
    )

    await goToLastStep(user)
    await user.click(screen.getByRole('button', { name: 'Enregistrer la visite' }))

    await waitFor(() => expect(createVisiteMock).toHaveBeenCalledTimes(1))
    expect(createVisiteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        commentaire: null,
        avecQui: null,
        reservation: null,
        budget: null,
        tempsAttente: null,
      }),
    )
  })

  it('bloque le passage à l\'étape suivante tant qu\'aucun restaurant n\'est sélectionné', () => {
    render(<AddVisitForm restaurants={restaurants} onSaved={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled()
  })

  it('préremplit avecQui, réservation, budget et tempsAttente en édition', () => {
    render(
      <AddVisitForm restaurants={restaurants} visite={existingVisite} onSaved={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'Couple' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Oui' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Budget (€)')).toHaveValue(42.5)
    expect(screen.getByLabelText("Temps d'attente (minutes)")).toHaveValue(15)
  })

  it('envoie les champs optionnels modifiés lors de la mise à jour', async () => {
    updateVisiteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AddVisitForm restaurants={restaurants} visite={existingVisite} onSaved={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Non' }))
    await goToLastStep(user)
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer les modifications' }),
    )

    await waitFor(() => expect(updateVisiteMock).toHaveBeenCalledTimes(1))
    expect(updateVisiteMock).toHaveBeenCalledWith(
      'visite-1',
      expect.objectContaining({
        avecQui: Compagnie.Couple,
        reservation: Reservation.Non,
        budget: 42.5,
        tempsAttente: 15,
      }),
    )
  })

  it('affiche la note et le commentaire à l\'étape "Notes & Avis"', async () => {
    const user = userEvent.setup()

    render(
      <AddVisitForm restaurants={restaurants} visite={existingVisite} onSaved={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(screen.getByRole('radiogroup', { name: 'Note' })).toBeInTheDocument()
    expect(screen.getByLabelText('Commentaire')).toHaveValue('Très bon')
  })
})
