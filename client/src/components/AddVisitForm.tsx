import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createVisite, updateVisite } from '../api/client.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import StarRating from './StarRating.tsx'
import PhotoUrlInput from './PhotoUrlInput.tsx'

interface AddVisitFormProps {
  restaurants: Restaurant[]
  visite?: Visite
  onSaved: (restaurantId: string) => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function AddVisitForm({ restaurants, visite, onSaved }: AddVisitFormProps) {
  const isEditing = visite !== undefined
  const [restaurantId, setRestaurantId] = useState(visite?.restaurantId ?? '')
  const [date, setDate] = useState(visite?.date ?? today())
  const [note, setNote] = useState(visite?.note ?? 5)
  const [commentaire, setCommentaire] = useState(visite?.commentaire ?? '')
  const [photos, setPhotos] = useState<string[]>(visite?.urlsPhotos ?? [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const restaurantNom =
    restaurants.find((r) => r.id === restaurantId)?.nom ?? restaurantId

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!restaurantId) {
      setError('Sélectionnez un restaurant.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      const commentaireValue =
        commentaire.trim().length > 0 ? commentaire.trim() : null
      if (visite) {
        await updateVisite(visite.id, {
          date,
          note,
          commentaire: commentaireValue,
          urlsPhotos: photos,
        })
      } else {
        await createVisite({
          restaurantId,
          date,
          note,
          commentaire: commentaireValue,
          urlsPhotos: photos,
        })
      }
      setSuccess(true)
      if (!isEditing) {
        setDate(today())
        setNote(5)
        setCommentaire('')
        setPhotos([])
      }
      onSaved(restaurantId)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? err.message)
      } else {
        setError(
          isEditing
            ? 'La modification de la visite a échoué.'
            : "L'enregistrement de la visite a échoué.",
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (restaurants.length === 0) {
    return (
      <div className="panel-form">
        <h2>Enregistrer une visite</h2>
        <p>Créez d'abord un restaurant avant d'enregistrer une visite.</p>
      </div>
    )
  }

  return (
    <form className="panel-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>{isEditing ? 'Modifier la visite' : 'Enregistrer une visite'}</h2>

      <span className="field-label">Restaurant</span>
      {isEditing ? (
        <p className="visite-restaurant-readonly">{restaurantNom}</p>
      ) : (
        <select
          id="visite-restaurant"
          value={restaurantId}
          onChange={(event) => setRestaurantId(event.target.value)}
          required
        >
          <option value="" disabled>
            Choisir un restaurant
          </option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.nom}
            </option>
          ))}
        </select>
      )}

      <label htmlFor="visite-date">Date</label>
      <input
        id="visite-date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        required
      />

      <span className="field-label">Note</span>
      <StarRating value={note} onChange={setNote} />

      <label htmlFor="visite-commentaire">Commentaire</label>
      <textarea
        id="visite-commentaire"
        value={commentaire}
        onChange={(event) => setCommentaire(event.target.value)}
        rows={3}
      />

      <span className="field-label">Photos</span>
      <PhotoUrlInput values={photos} onChange={setPhotos} />

      {error && <p className="form-error">{error}</p>}
      {success && (
        <p className="form-success">
          {isEditing
            ? 'Visite modifiée avec succès.'
            : 'Visite enregistrée avec succès.'}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting
          ? 'Enregistrement…'
          : isEditing
            ? 'Enregistrer les modifications'
            : 'Enregistrer la visite'}
      </button>
    </form>
  )
}

export default AddVisitForm
