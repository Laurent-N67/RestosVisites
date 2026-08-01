import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createRestaurant, updateRestaurant } from '../api/client.ts'
import type { AddressSuggestion } from '../api/photon.ts'
import type { Categorie, Restaurant } from '../api/types.ts'
import AddressSearch from './AddressSearch.tsx'
import CategoryPicker from './CategoryPicker.tsx'

interface AddRestaurantFormProps {
  restaurant?: Restaurant
  categories: Categorie[]
  onSaved: () => void
}

function AddRestaurantForm({ restaurant, categories, onSaved }: AddRestaurantFormProps) {
  const isEditing = restaurant !== undefined
  const [nom, setNom] = useState(restaurant?.nom ?? '')
  const [adresse, setAdresse] = useState(restaurant?.adresse ?? '')
  const [latitude, setLatitude] = useState<number | null>(
    restaurant?.latitude ?? null,
  )
  const [longitude, setLongitude] = useState<number | null>(
    restaurant?.longitude ?? null,
  )
  const [categorieIds, setCategorieIds] = useState<string[]>(
    restaurant?.categories.map((c) => c.id) ?? [],
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleAddressSelect(suggestion: AddressSuggestion) {
    setNom(suggestion.nom)
    setAdresse(suggestion.adresse)
    setLatitude(suggestion.latitude)
    setLongitude(suggestion.longitude)
    setSuccess(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (latitude === null || longitude === null) {
      setError(
        "Sélectionnez une adresse dans les suggestions pour définir sa position.",
      )
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      const payload = {
        nom: nom.trim(),
        adresse: adresse.trim(),
        latitude,
        longitude,
        categorieIds,
      }
      if (restaurant) {
        await updateRestaurant(restaurant.id, payload)
      } else {
        await createRestaurant(payload)
      }
      setSuccess(true)
      if (!isEditing) {
        setNom('')
        setAdresse('')
        setLatitude(null)
        setLongitude(null)
        setCategorieIds([])
      }
      onSaved()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Un restaurant avec ce nom et cette adresse existe déjà.')
      } else if (err instanceof ApiError) {
        setError(err.detail ?? err.message)
      } else {
        setError(
          isEditing
            ? 'La modification du restaurant a échoué.'
            : 'La création du restaurant a échoué.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="panel-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>{isEditing ? 'Modifier le restaurant' : 'Ajouter un restaurant'}</h2>

      <AddressSearch onSelect={handleAddressSelect} />

      <label htmlFor="restaurant-nom">Nom</label>
      <input
        id="restaurant-nom"
        type="text"
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        required
      />

      <label htmlFor="restaurant-adresse">Adresse</label>
      <input
        id="restaurant-adresse"
        type="text"
        value={adresse}
        onChange={(event) => setAdresse(event.target.value)}
        required
      />

      <span className="field-label">Catégories</span>
      <CategoryPicker
        categories={categories}
        selectedIds={categorieIds}
        onChange={setCategorieIds}
      />

      {latitude !== null && longitude !== null ? (
        <p className="coords-hint">
          Position : {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      ) : (
        <p className="coords-hint coords-hint--missing">
          Aucune position définie, choisissez une suggestion d'adresse.
        </p>
      )}

      {error && <p className="form-error">{error}</p>}
      {success && (
        <p className="form-success">
          {isEditing
            ? 'Restaurant modifié avec succès.'
            : 'Restaurant créé avec succès.'}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting
          ? isEditing
            ? 'Enregistrement…'
            : 'Création…'
          : isEditing
            ? 'Enregistrer les modifications'
            : 'Créer le restaurant'}
      </button>
    </form>
  )
}

export default AddRestaurantForm
