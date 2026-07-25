import { useEffect, useRef, useState } from 'react'
import type { AddressSuggestion } from '../api/photon.ts'
import { searchAddress } from '../api/photon.ts'

interface AddressSearchProps {
  onSelect: (suggestion: AddressSuggestion) => void
}

function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const searched = useRef(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      setLoading(true)
      searchAddress(trimmed, controller.signal)
        .then((results) => {
          searched.current = true
          setSuggestions(results)
          setError(null)
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return
          }
          setSuggestions([])
          setError(
            err instanceof Error
              ? err.message
              : "La recherche d'adresse a échoué.",
          )
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  function handleSelect(suggestion: AddressSuggestion) {
    setQuery(suggestion.label)
    setOpen(false)
    onSelect(suggestion)
  }

  return (
    <div className="address-search">
      <label htmlFor="address-search-input">
        Rechercher une adresse
      </label>
      <input
        id="address-search-input"
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Ex: 10 rue de la Paix, Paris"
        autoComplete="off"
      />
      {open && (
        <div className="address-search-results">
          {loading && <p className="address-search-status">Recherche…</p>}
          {!loading && error && (
            <p className="address-search-status address-search-error">
              {error}
            </p>
          )}
          {!loading &&
            !error &&
            searched.current &&
            suggestions.length === 0 &&
            query.trim().length >= 2 && (
              <p className="address-search-status">Aucun résultat.</p>
            )}
          {!loading && suggestions.length > 0 && (
            <ul>
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(suggestion)}
                  >
                    {suggestion.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressSearch
