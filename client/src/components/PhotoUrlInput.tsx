import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { ApiError, resolvePhotoUrl, uploadPhoto } from '../api/client.ts'
import Chips from './Chips.tsx'

interface PhotoUrlInputProps {
  values: string[]
  onChange: (values: string[]) => void
}

interface UploadProgress {
  current: number
  total: number
}

function PhotoUrlInput({ values, onChange }: PhotoUrlInputProps) {
  const [draft, setDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addPhoto(url: string) {
    const trimmed = url.trim()
    if (trimmed.length === 0) {
      return
    }
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
  }

  /**
   * Ajoute une photo à une liste locale (plutôt qu'à la prop `values`, qui
   * ne se met à jour qu'au prochain rendu) : nécessaire pour accumuler
   * correctement les résultats d'un lot d'uploads séquentiels.
   */
  function addPhotoTo(list: string[], url: string): string[] {
    const trimmed = url.trim()
    if (trimmed.length === 0 || list.includes(trimmed)) {
      return list
    }
    const next = [...list, trimmed]
    onChange(next)
    return next
  }

  function handleAddDraft() {
    addPhoto(draft)
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddDraft()
    }
  }

  function removePhoto(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setUploading(true)
    setUploadError(null)

    const failures: string[] = []
    let currentValues = values

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress({ current: i + 1, total: files.length })
      try {
        const { url } = await uploadPhoto(file)
        currentValues = addPhotoTo(currentValues, url)
      } catch (err) {
        const reason =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : "l'envoi a échoué"
        failures.push(`${file.name} (${reason})`)
      }
    }

    if (failures.length > 0) {
      setUploadError(
        failures.length === 1
          ? `1 photo n'a pas pu être envoyée : ${failures[0]}`
          : `${failures.length} photos n'ont pas pu être envoyées : ${failures.join(', ')}`,
      )
    }

    setUploading(false)
    setUploadProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="photo-url-input">
      <div className="photo-url-row">
        <input
          type="url"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://exemple.com/photo.jpg"
          disabled={uploading}
        />
        <button type="button" onClick={handleAddDraft} disabled={uploading}>
          Ajouter
        </button>
      </div>

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
          <span className="photo-upload-status">
            {uploadProgress
              ? `Envoi ${uploadProgress.current}/${uploadProgress.total}…`
              : 'Envoi en cours…'}
          </span>
        )}
      </div>

      {uploadError && <p className="form-error">{uploadError}</p>}

      <Chips
        items={values}
        onRemove={removePhoto}
        renderItem={(url) => (
          <>
            <img
              className="chip-thumb"
              src={resolvePhotoUrl(url)}
              alt=""
              loading="lazy"
            />
            <span className="chip-label">{url}</span>
          </>
        )}
      />
    </div>
  )
}

export default PhotoUrlInput
