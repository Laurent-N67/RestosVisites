import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Restaurant } from '../api/types.ts'
import { SearchIcon } from './icons/Icons.tsx'

interface RestaurantSearchProps {
  restaurants: Restaurant[]
  /**
   * Quand fourni, remplace le comportement par défaut (navigation vers la
   * fiche détail) : utilisé par la popover d'ajout aux favoris (Carte,
   * Phase 7c) pour intercepter la sélection sans quitter la page.
   */
  onSelect?: (restaurant: Restaurant) => void
}

const MAX_RESULTS = 6

function RestaurantSearch({ restaurants, onSelect }: RestaurantSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const trimmed = query.trim().toLowerCase()
  const results =
    trimmed.length === 0
      ? []
      : restaurants
          .filter(
            (restaurant) =>
              restaurant.nom.toLowerCase().includes(trimmed) ||
              restaurant.adresse.toLowerCase().includes(trimmed),
          )
          .slice(0, MAX_RESULTS)

  // Raccourci ⌘K / Ctrl+K pour focus la recherche depuis n'importe où dans
  // l'app, en cohérence avec l'indice affiché dans le champ.
  useEffect(() => {
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  function selectRestaurant(restaurant: Restaurant) {
    setQuery('')
    setOpen(false)
    if (onSelect) {
      onSelect(restaurant)
    } else {
      navigate(`/restaurants/${restaurant.id}`)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      event.currentTarget.blur()
    } else if (event.key === 'Enter' && results.length > 0) {
      selectRestaurant(results[0])
    }
  }

  function handleBlur() {
    // Laisse le temps au clic sur un résultat de se déclencher avant de
    // fermer la liste (sinon le onClick n'a jamais lieu, le blur ferme
    // d'abord la liste et démonte le bouton cliqué).
    window.setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="restaurant-search">
      <SearchIcon className="restaurant-search-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        className="restaurant-search-input"
        placeholder="Rechercher un restaurant, ville, cuisine…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label="Rechercher un restaurant"
      />
      {query.length === 0 && <kbd className="restaurant-search-kbd">⌘K</kbd>}
      {open && trimmed.length > 0 && (
        <ul className="restaurant-search-results">
          {results.length === 0 ? (
            <li className="restaurant-search-empty">Aucun restaurant trouvé.</li>
          ) : (
            results.map((restaurant) => (
              <li key={restaurant.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectRestaurant(restaurant)}
                >
                  <span className="restaurant-search-name">{restaurant.nom}</span>
                  <span className="restaurant-search-adresse">{restaurant.adresse}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default RestaurantSearch
