import { useEffect, useRef, useState } from 'react'
import type { AddressSearchBias, AddressSuggestion } from '../api/photon.ts'
import { searchAddress } from '../api/photon.ts'

interface AddressSearchProps {
  onSelect: (suggestion: AddressSuggestion) => void
}

const GEOLOCATION_TIMEOUT_MS = 5000

// Mise en cache au niveau du module : on ne demande la géolocalisation
// qu'une seule fois par session, quel que soit le nombre d'instances
// du composant.
let cachedBiasPromise: Promise<AddressSearchBias | undefined> | null = null

function getSessionBias(): Promise<AddressSearchBias | undefined> {
  if (!cachedBiasPromise) {
    cachedBiasPromise = new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(undefined)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
          // Permission refusée, indisponible, timeout… on se contente
          // de continuer sans biais, sans afficher d'erreur.
          resolve(undefined)
        },
        { timeout: GEOLOCATION_TIMEOUT_MS },
      )
    })
  }

  return cachedBiasPromise
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
      getSessionBias()
        .then((bias) => {
          if (controller.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError')
          }
          return searchAddress(trimmed, controller.signal, bias)
        })
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
