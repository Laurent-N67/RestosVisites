import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import Chips from './Chips.tsx'

interface PhotoUrlInputProps {
  values: string[]
  onChange: (values: string[]) => void
}

function PhotoUrlInput({ values, onChange }: PhotoUrlInputProps) {
  const [draft, setDraft] = useState('')

  function addPhoto() {
    const trimmed = draft.trim()
    if (trimmed.length === 0) {
      return
    }
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addPhoto()
    }
  }

  function removePhoto(index: number) {
    onChange(values.filter((_, i) => i !== index))
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
        />
        <button type="button" onClick={addPhoto}>
          Ajouter
        </button>
      </div>
      <Chips items={values} onRemove={removePhoto} />
    </div>
  )
}

export default PhotoUrlInput
