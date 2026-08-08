import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AddressSuggestion } from '../api/photon.ts'
import type { Categorie, Restaurant } from '../api/types.ts'
import AddRestaurantForm from './AddRestaurantForm.tsx'

const {
  createRestaurantMock,
  updateRestaurantMock,
  addRestaurantPhotoMock,
  removeRestaurantPhotoMock,
  setRestaurantPhotoPrincipaleMock,
  uploadPhotoMock,
} = vi.hoisted(() => ({
  createRestaurantMock: vi.fn(),
  updateRestaurantMock: vi.fn(),
  addRestaurantPhotoMock: vi.fn(),
  removeRestaurantPhotoMock: vi.fn(),
  setRestaurantPhotoPrincipaleMock: vi.fn(),
  uploadPhotoMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts')
  return {
    ...actual,
    createRestaurant: createRestaurantMock,
    updateRestaurant: updateRestaurantMock,
    addRestaurantPhoto: addRestaurantPhotoMock,
    removeRestaurantPhoto: removeRestaurantPhotoMock,
    setRestaurantPhotoPrincipale: setRestaurantPhotoPrincipaleMock,
    uploadPhoto: uploadPhotoMock,
  }
})

const addressSuggestion: AddressSuggestion = {
  id: 'addr-1',
  label: '1 rue de Paris, Paris',
  nom: 'Le Bon Coin',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
}

vi.mock('./AddressSearch.tsx', () => ({
  default: ({ onSelect }: { onSelect: (suggestion: AddressSuggestion) => void }) => (
    <button type="button" onClick={() => onSelect(addressSuggestion)}>
      Choisir une adresse (test)
    </button>
  ),
}))

const categories: Categorie[] = [
  { id: 'cat-1', nom: 'Italien', groupe: 'Type de cuisine' },
]

const existingRestaurant: Restaurant = {
  id: 'restaurant-1',
  nom: 'Le Bon Coin',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [],
  description: 'Une description',
  telephone: '0102030405',
  siteWeb: 'https://exemple.com',
  horaires: 'Lun-Ven 12h-14h',
  photos: [
    { id: 'photo-1', url: '/uploads/photo-1.jpg', estPrincipale: true, ordre: 0 },
  ],
}

describe('AddRestaurantForm', () => {
  beforeEach(() => {
    createRestaurantMock.mockReset()
    updateRestaurantMock.mockReset()
    addRestaurantPhotoMock.mockReset()
    removeRestaurantPhotoMock.mockReset()
    setRestaurantPhotoPrincipaleMock.mockReset()
    uploadPhotoMock.mockReset()
  })

  it('parcourt les 2 étapes et crée le restaurant', async () => {
    createRestaurantMock.mockResolvedValue({ id: 'new-restaurant' })
    const user = userEvent.setup()
    const onSaved = vi.fn()

    render(<AddRestaurantForm categories={categories} onSaved={onSaved} />)

    // Étape 1 : le bouton "Suivant" est désactivé tant que le nom est vide.
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled()
    await user.type(screen.getByLabelText('Nom'), 'Chez Mario')

    await user.click(screen.getByRole('button', { name: 'Choisir une adresse (test)' }))
    expect(
      screen.getByText('Position : 48.85000, 2.35000'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Suivant' }))

    await waitFor(() => expect(createRestaurantMock).toHaveBeenCalledTimes(1))
    // Sélectionner une suggestion d'adresse écrase le nom saisi à l'étape 1
    // (comportement hérité intentionnel, cf. AddRestaurantForm.tsx).
    expect(createRestaurantMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nom: 'Le Bon Coin',
        adresse: '1 rue de Paris',
        latitude: 48.85,
        longitude: 2.35,
      }),
    )

    // Étape 2 : aucune photo pour le moment.
    expect(
      await screen.findByText('Aucune photo pour ce restaurant.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Terminer' }))
    expect(onSaved).toHaveBeenCalledWith('new-restaurant')
  })

  it("désactive l'onglet Photos tant que le restaurant n'a pas été créé", async () => {
    const user = userEvent.setup()

    render(<AddRestaurantForm categories={categories} onSaved={vi.fn()} />)

    expect(screen.getByRole('tab', { name: '2 Photos' })).toBeDisabled()

    await user.type(screen.getByLabelText('Nom'), 'Chez Mario')

    // Toujours désactivé : le restaurant n'existe pas encore (pas d'adresse).
    expect(screen.getByRole('tab', { name: '2 Photos' })).toBeDisabled()
  })

  it("conserve la dernière modification de l'étape 1 même après un aller-retour par l'étape 2", async () => {
    createRestaurantMock.mockResolvedValue({ id: 'new-restaurant' })
    updateRestaurantMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const onSaved = vi.fn()

    render(<AddRestaurantForm categories={categories} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Nom'), 'Chez Mario')
    await user.click(screen.getByRole('button', { name: 'Choisir une adresse (test)' }))
    await user.click(screen.getByRole('button', { name: 'Suivant' }))

    await waitFor(() => expect(createRestaurantMock).toHaveBeenCalledTimes(1))
    await screen.findByText('Aucune photo pour ce restaurant.')

    // Retour à l'étape 1, nouvelle modification du nom, puis retour direct à
    // l'étape 2 via l'onglet (pas via "Suivant") : la dernière valeur doit
    // quand même être persistée avant de pouvoir terminer.
    await user.click(screen.getByRole('tab', { name: '1 Informations' }))
    await user.clear(screen.getByLabelText('Nom'))
    await user.type(screen.getByLabelText('Nom'), 'Chez Mario Deux')
    await user.click(screen.getByRole('tab', { name: '2 Photos' }))

    await waitFor(() =>
      expect(updateRestaurantMock).toHaveBeenCalledWith(
        'new-restaurant',
        expect.objectContaining({ nom: 'Chez Mario Deux' }),
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Terminer' }))
    expect(onSaved).toHaveBeenCalledWith('new-restaurant')
  })

  it("bloque le passage à l'étape 2 si aucune adresse n'a été sélectionnée", async () => {
    const user = userEvent.setup()

    render(<AddRestaurantForm categories={categories} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText('Nom'), 'Chez Mario')
    await user.click(screen.getByRole('button', { name: 'Suivant' }))

    expect(
      await screen.findByText('Utilisez la recherche pour localiser le restaurant.'),
    ).toBeInTheDocument()
    expect(createRestaurantMock).not.toHaveBeenCalled()
  })

  it('édition : toutes les étapes sont accessibles immédiatement', async () => {
    const user = userEvent.setup()

    render(
      <AddRestaurantForm
        restaurant={existingRestaurant}
        categories={categories}
        onSaved={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Nom')).toHaveValue('Le Bon Coin')
    expect(screen.getByLabelText('Téléphone')).toHaveValue('0102030405')

    await user.click(screen.getByRole('tab', { name: '2 Photos' }))
    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      'http://localhost:5006/uploads/photo-1.jpg',
    )

    await user.click(screen.getByRole('tab', { name: '1 Informations' }))
    expect(screen.getByLabelText('Nom')).toHaveValue('Le Bon Coin')
  })

  it('étape 1 → 2 en édition sauvegarde les champs saisis via updateRestaurant', async () => {
    updateRestaurantMock.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AddRestaurantForm
        restaurant={existingRestaurant}
        categories={categories}
        onSaved={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Téléphone'))
    await user.type(screen.getByLabelText('Téléphone'), '0600000000')
    await user.click(screen.getByRole('button', { name: 'Suivant' }))

    await waitFor(() =>
      expect(updateRestaurantMock).toHaveBeenCalledWith(
        'restaurant-1',
        expect.objectContaining({ telephone: '0600000000' }),
      ),
    )
  })

  it("gère l'ajout par URL, le passage en principale et la suppression de photos", async () => {
    addRestaurantPhotoMock.mockResolvedValue({ photoId: 'photo-2' })
    setRestaurantPhotoPrincipaleMock.mockResolvedValue(undefined)
    removeRestaurantPhotoMock.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AddRestaurantForm
        restaurant={existingRestaurant}
        categories={categories}
        onSaved={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: '2 Photos' }))

    await user.type(
      screen.getByPlaceholderText('https://exemple.com/photo.jpg'),
      'https://exemple.com/nouvelle.jpg',
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    await waitFor(() =>
      expect(addRestaurantPhotoMock).toHaveBeenCalledWith(
        'restaurant-1',
        'https://exemple.com/nouvelle.jpg',
      ),
    )

    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(2)

    // La photo déjà principale affiche un badge, la nouvelle affiche le bouton.
    const newItem = items.find((item) =>
      within(item).queryByRole('button', { name: 'Définir comme principale' }),
    )
    expect(newItem).toBeDefined()

    await user.click(
      within(newItem!).getByRole('button', { name: 'Définir comme principale' }),
    )
    await waitFor(() =>
      expect(setRestaurantPhotoPrincipaleMock).toHaveBeenCalledWith(
        'restaurant-1',
        'photo-2',
      ),
    )

    const supprimerButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    await user.click(supprimerButtons[0])

    await waitFor(() =>
      expect(removeRestaurantPhotoMock).toHaveBeenCalledWith(
        'restaurant-1',
        'photo-1',
      ),
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('gère l’upload de fichier et attache la photo au restaurant', async () => {
    uploadPhotoMock.mockResolvedValue({ url: '/uploads/uploaded.jpg' })
    addRestaurantPhotoMock.mockResolvedValue({ photoId: 'photo-3' })
    const user = userEvent.setup()

    render(
      <AddRestaurantForm
        restaurant={existingRestaurant}
        categories={categories}
        onSaved={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: '2 Photos' }))

    const file = new File(['contenu'], 'photo.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => expect(uploadPhotoMock).toHaveBeenCalledWith(file))
    await waitFor(() =>
      expect(addRestaurantPhotoMock).toHaveBeenCalledWith(
        'restaurant-1',
        '/uploads/uploaded.jpg',
      ),
    )
    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
  })
})
