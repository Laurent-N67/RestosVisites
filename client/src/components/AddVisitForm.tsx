import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createVisite } from '../api/client.ts'
import type { Restaurant } from '../api/types.ts'
import StarRating from './StarRating.tsx'
import TagInput from './TagInput.tsx'
import PhotoUrlInput from './PhotoUrlInput.tsx'

interface AddVisitFormProps {
  restaurants: Restaurant[]
  onCreated: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function AddVisitForm({ restaurants, onCreated }: AddVisitFormProps) {
  const [restaurantId, setRestaurantId] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      await createVisite({
        restaurantId,
        date,
        note,
        commentaire: commentaire.trim().length > 0 ? commentaire.trim() : null,
        nomsCategories: categories,
        urlsPhotos: photos,
      })
      setSuccess(true)
      setDate(today())
      setNote(5)
      setCommentaire('')
      setCategories([])
      setPhotos([])
      onCreated()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? err.message)
      } else {
        setError("L'enregistrement de la visite a échoué.")
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
      <h2>Enregistrer une visite</h2>

      <label htmlFor="visite-restaurant">Restaurant</label>
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

      <span className="field-label">Catégories</span>
      <TagInput values={categories} onChange={setCategories} />

      <span className="field-label">Photos</span>
      <PhotoUrlInput values={photos} onChange={setPhotos} />

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">Visite enregistrée avec succès.</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Enregistrement…' : 'Enregistrer la visite'}
      </button>
    </form>
  )
}

export default AddVisitForm
