import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createVisite, updateVisite } from '../api/client.ts'
import { Compagnie, Reservation } from '../api/types.ts'
import type { Restaurant, Visite } from '../api/types.ts'
import StarRating from './StarRating.tsx'
import PhotoUrlInput from './PhotoUrlInput.tsx'

interface AddVisitFormProps {
  restaurants: Restaurant[]
  visite?: Visite
  initialRestaurantId?: string
  onSaved: (restaurantId: string) => void
}

const compagnieOptions: { value: Compagnie; label: string }[] = [
  { value: Compagnie.Seul, label: 'Seul' },
  { value: Compagnie.Couple, label: 'Couple' },
  { value: Compagnie.Amis, label: 'Amis' },
  { value: Compagnie.Famille, label: 'Famille' },
]

const reservationOptions: { value: Reservation; label: string }[] = [
  { value: Reservation.Indifferent, label: 'Indifférent' },
  { value: Reservation.Oui, label: 'Oui' },
  { value: Reservation.Non, label: 'Non' },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function hasSecondaryDetails(visite: Visite | undefined): boolean {
  return (
    visite !== undefined &&
    (visite.budget !== null ||
      visite.tempsAttente !== null ||
      visite.reservation !== null)
  )
}

function AddVisitForm({
  restaurants,
  visite,
  initialRestaurantId,
  onSaved,
}: AddVisitFormProps) {
  const isEditing = visite !== undefined
  const [restaurantId, setRestaurantId] = useState(
    visite?.restaurantId ?? initialRestaurantId ?? '',
  )
  const [date, setDate] = useState(visite?.date ?? today())
  const [note, setNote] = useState(visite?.note ?? 5)
  const [commentaire, setCommentaire] = useState(visite?.commentaire ?? '')
  const [photos, setPhotos] = useState<string[]>(visite?.urlsPhotos ?? [])
  const [avecQui, setAvecQui] = useState<Compagnie | null>(visite?.avecQui ?? null)
  const [reservation, setReservation] = useState<Reservation | null>(
    visite?.reservation ?? null,
  )
  const [budget, setBudget] = useState(
    visite?.budget !== null && visite?.budget !== undefined
      ? String(visite.budget)
      : '',
  )
  const [tempsAttente, setTempsAttente] = useState(
    visite?.tempsAttente !== null && visite?.tempsAttente !== undefined
      ? String(visite.tempsAttente)
      : '',
  )
  const [detailsOpen, setDetailsOpen] = useState(() => hasSecondaryDetails(visite))
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
      const budgetValue = budget.trim().length > 0 ? Number(budget) : null
      const tempsAttenteValue =
        tempsAttente.trim().length > 0 ? Number(tempsAttente) : null
      if (visite) {
        await updateVisite(visite.id, {
          date,
          note,
          commentaire: commentaireValue,
          urlsPhotos: photos,
          avecQui,
          reservation,
          budget: budgetValue,
          tempsAttente: tempsAttenteValue,
        })
      } else {
        await createVisite({
          restaurantId,
          date,
          note,
          commentaire: commentaireValue,
          urlsPhotos: photos,
          avecQui,
          reservation,
          budget: budgetValue,
          tempsAttente: tempsAttenteValue,
        })
      }
      setSuccess(true)
      if (!isEditing) {
        setDate(today())
        setNote(5)
        setCommentaire('')
        setPhotos([])
        setAvecQui(null)
        setReservation(null)
        setBudget('')
        setTempsAttente('')
        setDetailsOpen(false)
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

      <span className="field-label">Avec qui ?</span>
      <div className="segmented-control" role="group" aria-label="Avec qui ?">
        {compagnieOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={avecQui === option.value}
            className={
              avecQui === option.value ? 'chip-filter chip-filter--active' : 'chip-filter'
            }
            onClick={() => setAvecQui(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label htmlFor="visite-commentaire">Commentaire</label>
      <textarea
        id="visite-commentaire"
        value={commentaire}
        onChange={(event) => setCommentaire(event.target.value)}
        rows={3}
      />

      <span className="field-label">Photos</span>
      <PhotoUrlInput values={photos} onChange={setPhotos} />

      <details
        className="visite-details"
        open={detailsOpen}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
      >
        <summary>Plus de détails</summary>

        <label htmlFor="visite-budget">Budget (€)</label>
        <input
          id="visite-budget"
          type="number"
          step="0.01"
          min="0"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
        />

        <label htmlFor="visite-temps-attente">Temps d'attente (minutes)</label>
        <input
          id="visite-temps-attente"
          type="number"
          step="1"
          min="0"
          value={tempsAttente}
          onChange={(event) => setTempsAttente(event.target.value)}
        />

        <span className="field-label">Réservation</span>
        <div className="segmented-control" role="group" aria-label="Réservation">
          {reservationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={reservation === option.value}
              className={
                reservation === option.value
                  ? 'chip-filter chip-filter--active'
                  : 'chip-filter'
              }
              onClick={() => setReservation(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </details>

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
