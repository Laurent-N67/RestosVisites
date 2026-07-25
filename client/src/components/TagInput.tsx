import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import Chips from './Chips.tsx'

interface TagInputProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag() {
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
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    }
  }

  function removeTag(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="tag-input">
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Ajouter une catégorie puis Entrée'}
      />
      <Chips items={values} onRemove={removeTag} />
    </div>
  )
}

export default TagInput
