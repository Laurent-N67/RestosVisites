import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createVisite, resolvePhotoUrl, updateVisite } from '../api/client.ts'
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

type Step = 1 | 2 | 3

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Détails de la visite' },
  { n: 2, label: 'Notes & Avis' },
  { n: 3, label: 'Photos' },
]

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

function AddVisitForm({
  restaurants,
  visite,
  initialRestaurantId,
  onSaved,
}: AddVisitFormProps) {
  const isEditing = visite !== undefined
  const [step, setStep] = useState<Step>(1)
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId)
  const restaurantNom = selectedRestaurant?.nom ?? restaurantId
  const canReachOtherSteps = restaurantId.trim().length > 0

  function goToStep(target: Step) {
    if (target === step) {
      return
    }
    if (target > step && !canReachOtherSteps) {
      setError('Sélectionnez un restaurant.')
      return
    }
    setError(null)
    setStep(target)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!restaurantId) {
      setError('Sélectionnez un restaurant.')
      setStep(1)
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
        setStep(1)
        setDate(today())
        setNote(5)
        setCommentaire('')
        setPhotos([])
        setAvecQui(null)
        setReservation(null)
        setBudget('')
        setTempsAttente('')
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

      <div className="wizard-steps" role="tablist" aria-label="Étapes du formulaire">
        {STEPS.map(({ n, label }) => {
          const reachable = n === 1 || canReachOtherSteps
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={step === n}
              className={step === n ? 'wizard-step wizard-step--active' : 'wizard-step'}
              disabled={!reachable}
              onClick={() => goToStep(n)}
            >
              <span className="wizard-step-number">{n}</span>{' '}
              <span className="wizard-step-label">{label}</span>
            </button>
          )
        })}
      </div>

      {step === 1 && (
        <>
          {selectedRestaurant && (
            <div className="visite-restaurant-preview">
              {selectedRestaurant.photos.length > 0 && (
                <img
                  className="visite-restaurant-preview-thumb"
                  src={resolvePhotoUrl(selectedRestaurant.photos[0].url)}
                  alt=""
                  loading="lazy"
                />
              )}
              <div className="visite-restaurant-preview-info">
                <p className="visite-restaurant-preview-nom">
                  {selectedRestaurant.nom}
                </p>
                <p className="visite-restaurant-preview-adresse">
                  {selectedRestaurant.adresse}
                </p>
              </div>
            </div>
          )}

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

          <span className="field-label">Avec qui ?</span>
          <div className="segmented-control" role="group" aria-label="Avec qui ?">
            {compagnieOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={avecQui === option.value}
                className={
                  avecQui === option.value
                    ? 'chip-filter chip-filter--active'
                    : 'chip-filter'
                }
                onClick={() => setAvecQui(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

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
        </>
      )}

      {step === 2 && (
        <>
          <span className="field-label">Note</span>
          <StarRating value={note} onChange={setNote} />

          <label htmlFor="visite-commentaire">Commentaire</label>
          <textarea
            id="visite-commentaire"
            value={commentaire}
            onChange={(event) => setCommentaire(event.target.value)}
            rows={3}
          />
        </>
      )}

      {step === 3 && (
        <>
          <span className="field-label">Photos</span>
          <PhotoUrlInput values={photos} onChange={setPhotos} />
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      {success && (
        <p className="form-success">
          {isEditing
            ? 'Visite modifiée avec succès.'
            : 'Visite enregistrée avec succès.'}
        </p>
      )}

      <div className="wizard-nav">
        {step > 1 && (
          <button
            type="button"
            className="wizard-nav-back"
            onClick={() => goToStep((step - 1) as Step)}
            disabled={submitting}
          >
            ← Précédent
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            onClick={() => goToStep((step + 1) as Step)}
            disabled={step === 1 && !canReachOtherSteps}
          >
            Suivant
          </button>
        )}
        {step === 3 && (
          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Enregistrement…'
              : isEditing
                ? 'Enregistrer les modifications'
                : 'Enregistrer la visite'}
          </button>
        )}
      </div>
    </form>
  )
}

export default AddVisitForm
