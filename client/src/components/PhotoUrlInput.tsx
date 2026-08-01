import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { ApiError, resolvePhotoUrl, uploadPhoto } from '../api/client.ts'
import Chips from './Chips.tsx'

interface PhotoUrlInputProps {
  values: string[]
  onChange: (values: string[]) => void
}

function PhotoUrlInput({ values, onChange }: PhotoUrlInputProps) {
  const [draft, setDraft] = useState('')
  const [uploading, setUploading] = useState(false)
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
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const { url } = await uploadPhoto(file)
      addPhoto(url)
    } catch (err) {
      setUploadError(
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : "L'envoi de la photo a échoué.",
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
          onChange={(event) => void handleFileChange(event)}
          disabled={uploading}
        />
        {uploading && <span className="photo-upload-status">Envoi en cours…</span>}
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
