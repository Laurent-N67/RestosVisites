import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import {
  addRestaurantPhoto,
  ApiError,
  createRestaurant,
  removeRestaurantPhoto,
  resolvePhotoUrl,
  setRestaurantPhotoPrincipale,
  updateRestaurant,
  uploadPhoto,
} from '../api/client.ts'
import type { AddressSuggestion } from '../api/photon.ts'
import type { Categorie, Restaurant, RestaurantPhoto } from '../api/types.ts'
import AddressSearch from './AddressSearch.tsx'
import CategoryPicker from './CategoryPicker.tsx'

interface AddRestaurantFormProps {
  restaurant?: Restaurant
  categories: Categorie[]
  onSaved: (restaurantId: string) => void
}

type Step = 1 | 2 | 3

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Informations' },
  { n: 2, label: 'Coordonnées' },
  { n: 3, label: 'Photos' },
]

function AddRestaurantForm({ restaurant, categories, onSaved }: AddRestaurantFormProps) {
  const isEditing = restaurant !== undefined
  const [step, setStep] = useState<Step>(1)

  // Étape 1 — Informations
  const [nom, setNom] = useState(restaurant?.nom ?? '')
  const [description, setDescription] = useState(restaurant?.description ?? '')
  const [categorieIds, setCategorieIds] = useState<string[]>(
    restaurant?.categories.map((c) => c.id) ?? [],
  )

  // Étape 2 — Coordonnées
  const [adresse, setAdresse] = useState(restaurant?.adresse ?? '')
  const [latitude, setLatitude] = useState<number | null>(
    restaurant?.latitude ?? null,
  )
  const [longitude, setLongitude] = useState<number | null>(
    restaurant?.longitude ?? null,
  )
  const [telephone, setTelephone] = useState(restaurant?.telephone ?? '')
  const [siteWeb, setSiteWeb] = useState(restaurant?.siteWeb ?? '')
  const [horaires, setHoraires] = useState(restaurant?.horaires ?? '')

  // Étape 3 — Photos (n'existe que lorsque le restaurant a été créé/enregistré)
  const [restaurantId, setRestaurantId] = useState<string | null>(
    restaurant?.id ?? null,
  )
  const [photos, setPhotos] = useState<RestaurantPhoto[]>(restaurant?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedPhotos = [...photos].sort((a, b) => a.ordre - b.ordre)

  const canReachStep2 = restaurantId !== null || nom.trim().length > 0
  const canReachStep3 = restaurantId !== null

  function handleAddressSelect(suggestion: AddressSuggestion) {
    setNom(suggestion.nom)
    setAdresse(suggestion.adresse)
    setLatitude(suggestion.latitude)
    setLongitude(suggestion.longitude)
  }

  async function goToStep(target: Step) {
    if (target === step) {
      return
    }
    setError(null)

    if (target === 1) {
      setStep(1)
      return
    }

    if (target === 2) {
      if (restaurantId === null && nom.trim().length === 0) {
        setError('Le nom est obligatoire.')
        return
      }
      setStep(2)
      return
    }

    // target === 3 : on persiste les champs des étapes 1 et 2 avant d'avancer.
    if (nom.trim().length === 0) {
      setError('Le nom est obligatoire.')
      setStep(1)
      return
    }
    if (latitude === null || longitude === null) {
      setError(
        "Sélectionnez une adresse dans les suggestions pour définir sa position.",
      )
      setStep(2)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        nom: nom.trim(),
        adresse: adresse.trim(),
        latitude,
        longitude,
        categorieIds,
        description: description.trim().length > 0 ? description.trim() : null,
        telephone: telephone.trim().length > 0 ? telephone.trim() : null,
        siteWeb: siteWeb.trim().length > 0 ? siteWeb.trim() : null,
        horaires: horaires.trim().length > 0 ? horaires.trim() : null,
      }
      if (restaurantId) {
        await updateRestaurant(restaurantId, payload)
      } else {
        const created = await createRestaurant(payload)
        setRestaurantId(created.id)
      }
      setStep(3)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Un restaurant avec ce nom et cette adresse existe déjà.')
      } else if (err instanceof ApiError) {
        setError(err.detail ?? err.message)
      } else {
        setError(
          restaurantId
            ? 'La modification du restaurant a échoué.'
            : 'La création du restaurant a échoué.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function attachPhotoUrl(url: string) {
    const trimmed = url.trim()
    if (trimmed.length === 0 || !restaurantId) {
      return
    }
    setAttaching(true)
    setPhotoError(null)
    try {
      const created = await addRestaurantPhoto(restaurantId, trimmed)
      setPhotos((prev) => [
        ...prev,
        { id: created.photoId, url: trimmed, estPrincipale: false, ordre: prev.length },
      ])
    } catch (err) {
      setPhotoError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : "L'ajout de la photo a échoué.",
      )
    } finally {
      setAttaching(false)
    }
  }

  async function handleAttachDraft() {
    await attachPhotoUrl(urlDraft)
    setUrlDraft('')
  }

  function handleUrlKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleAttachDraft()
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0 || !restaurantId) {
      return
    }

    setUploading(true)
    setPhotoError(null)
    const failures: string[] = []

    for (const file of files) {
      try {
        const { url } = await uploadPhoto(file)
        const created = await addRestaurantPhoto(restaurantId, url)
        setPhotos((prev) => [
          ...prev,
          { id: created.photoId, url, estPrincipale: false, ordre: prev.length },
        ])
      } catch (err) {
        const reason =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : "l'envoi a échoué"
        failures.push(`${file.name} (${reason})`)
      }
    }

    if (failures.length > 0) {
      setPhotoError(
        failures.length === 1
          ? `1 photo n'a pas pu être envoyée : ${failures[0]}`
          : `${failures.length} photos n'ont pas pu être envoyées : ${failures.join(', ')}`,
      )
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSetPrincipale(photoId: string) {
    if (!restaurantId) {
      return
    }
    setPhotoError(null)
    try {
      await setRestaurantPhotoPrincipale(restaurantId, photoId)
      setPhotos((prev) =>
        prev.map((photo) => ({ ...photo, estPrincipale: photo.id === photoId })),
      )
    } catch (err) {
      setPhotoError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : "La mise à jour de la photo principale a échoué.",
      )
    }
  }

  async function handleRemovePhoto(photoId: string) {
    if (!restaurantId) {
      return
    }
    setPhotoError(null)
    try {
      await removeRestaurantPhoto(restaurantId, photoId)
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
    } catch (err) {
      setPhotoError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : 'La suppression de la photo a échoué.',
      )
    }
  }

  function handleFinish() {
    if (restaurantId) {
      onSaved(restaurantId)
    }
  }

  return (
    <div className="panel-form">
      <h2>{isEditing ? 'Modifier le restaurant' : 'Ajouter un restaurant'}</h2>

      <div className="wizard-steps" role="tablist" aria-label="Étapes du formulaire">
        {STEPS.map(({ n, label }) => {
          const reachable = n === 1 || (n === 2 && canReachStep2) || (n === 3 && canReachStep3)
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={step === n}
              className={step === n ? 'wizard-step wizard-step--active' : 'wizard-step'}
              disabled={!reachable}
              onClick={() => void goToStep(n)}
            >
              <span className="wizard-step-number">{n}</span>{' '}
              <span className="wizard-step-label">{label}</span>
            </button>
          )
        })}
      </div>

      {step === 1 && (
        <>
          <label htmlFor="restaurant-nom">Nom</label>
          <input
            id="restaurant-nom"
            type="text"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            required
          />

          <span className="field-label">Catégories</span>
          <CategoryPicker
            categories={categories}
            selectedIds={categorieIds}
            onChange={setCategorieIds}
          />

          <label htmlFor="restaurant-description">Description</label>
          <textarea
            id="restaurant-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </>
      )}

      {step === 2 && (
        <>
          <AddressSearch onSelect={handleAddressSelect} />

          <label htmlFor="restaurant-adresse">Adresse</label>
          <input
            id="restaurant-adresse"
            type="text"
            value={adresse}
            onChange={(event) => setAdresse(event.target.value)}
            required
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

          <label htmlFor="restaurant-telephone">Téléphone</label>
          <input
            id="restaurant-telephone"
            type="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            placeholder="01 23 45 67 89"
          />

          <label htmlFor="restaurant-siteweb">Site web</label>
          <input
            id="restaurant-siteweb"
            type="url"
            value={siteWeb}
            onChange={(event) => setSiteWeb(event.target.value)}
            placeholder="https://exemple.com"
          />

          <label htmlFor="restaurant-horaires">Horaires</label>
          <textarea
            id="restaurant-horaires"
            value={horaires}
            onChange={(event) => setHoraires(event.target.value)}
            rows={2}
            placeholder="Lun-Ven 12h-14h, 19h-22h30"
          />
        </>
      )}

      {step === 3 && restaurantId && (
        <div className="restaurant-photos-step">
          <span className="field-label">Photos</span>

          <div className="photo-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => void handleFileChange(event)}
              disabled={uploading}
            />
            {uploading && (
              <span className="photo-upload-status">Envoi en cours…</span>
            )}
          </div>

          <div className="photo-url-row">
            <input
              type="url"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              onKeyDown={handleUrlKeyDown}
              placeholder="https://exemple.com/photo.jpg"
              disabled={attaching}
            />
            <button
              type="button"
              onClick={() => void handleAttachDraft()}
              disabled={attaching}
            >
              Ajouter
            </button>
          </div>

          {photoError && <p className="form-error">{photoError}</p>}

          {sortedPhotos.length === 0 ? (
            <p className="chips-empty">Aucune photo pour ce restaurant.</p>
          ) : (
            <ul className="restaurant-photo-grid">
              {sortedPhotos.map((photo) => (
                <li key={photo.id} className="restaurant-photo-item">
                  <img
                    className="restaurant-photo-thumb"
                    src={resolvePhotoUrl(photo.url)}
                    alt=""
                    loading="lazy"
                  />
                  <div className="restaurant-photo-item-actions">
                    {photo.estPrincipale ? (
                      <span className="restaurant-photo-badge">★ Principale</span>
                    ) : (
                      <button
                        type="button"
                        className="popup-btn"
                        onClick={() => void handleSetPrincipale(photo.id)}
                      >
                        Définir comme principale
                      </button>
                    )}
                    <button
                      type="button"
                      className="popup-btn popup-btn-danger"
                      onClick={() => void handleRemovePhoto(photo.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="wizard-nav">
        {step > 1 && (
          <button
            type="button"
            className="wizard-nav-back"
            onClick={() => void goToStep((step - 1) as Step)}
            disabled={submitting}
          >
            ← Précédent
          </button>
        )}
        {step === 1 && (
          <button
            type="button"
            onClick={() => void goToStep(2)}
            disabled={nom.trim().length === 0}
          >
            Suivant
          </button>
        )}
        {step === 2 && (
          <button type="button" onClick={() => void goToStep(3)} disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Suivant'}
          </button>
        )}
        {step === 3 && (
          <button type="button" onClick={handleFinish} disabled={!restaurantId}>
            Terminer
          </button>
        )}
      </div>
    </div>
  )
}

export default AddRestaurantForm
